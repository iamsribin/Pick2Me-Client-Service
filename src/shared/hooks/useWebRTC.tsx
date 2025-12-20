import { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { emitSocket } from "@/shared/utils/emitSocket";
import { toast } from "@/shared/hooks/use-toast";
import { RideDetails } from "../types/common";
import socketService from "../services/socketService";
import { RootState } from "../services/redux/store";

const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

const useWebRTC = (rideDetails: RideDetails, status: string) => {
  const dispatch = useDispatch();
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callActive, setCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentUserRole = useSelector((state: RootState) => state.user.role);
  const rideId = rideDetails.rideId;

  const receiverId = useMemo(() => {
    if (currentUserRole === "User") {
      return rideDetails.driver?.driverId;
    } else if (currentUserRole === "Driver") {
      return rideDetails.user?.userId;
    }
    return null;
  }, [currentUserRole, rideDetails]);

  useEffect(() => {
    const handleIncomingCall = async (data: { offer: any }) => {
      console.log("Incoming call received");
      setIncomingCall(data);
    };
    const handleCallAccepted = async (data: { answer: any }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        setIsCalling(false);
        setCallActive(true);
      }
    };
    const handleIceCandidate = async (data: { candidate: any }) => {
      if (peerConnection.current && data.candidate) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    };
    const handleCallEnded = () => {
      endCallCleanup();
      toast({ description: "Call ended", variant: "default" });
    };
    const offIncoming = socketService.on("call:incoming", handleIncomingCall);
    const offAccepted = socketService.on("call:accepted", handleCallAccepted);
    const offIce = socketService.on("call:ice-candidate", handleIceCandidate);
    const offEnded = socketService.on("call:ended", handleCallEnded);
    return () => {
      offIncoming();
      offAccepted();
      offIce();
      offEnded();
    };
  }, [dispatch, rideId]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(peerConnectionConfig);
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        dispatch(
          emitSocket("call:ice-candidate", {
            receiver: receiverId,
            candidate: event.candidate.toJSON(),
          })
        );
      }
    };
    pc.ontrack = (event: any) => {
      console.log("🎵 Remote track received", event.streams);
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch((error) => {
          console.error("Error playing remote audio:", error);
        });
      }
    };
    return pc;
  };

  const startCall = async () => {
    try {
      setIsCalling(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      const pc = createPeerConnection();
      peerConnection.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      dispatch(
        emitSocket("call:start", {
          receiver: receiverId,
          offer: offer,
        })
      );
    } catch (error) {
      console.error("Error starting call:", error);
      setIsCalling(false);
      toast({
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      const pc = createPeerConnection();
      peerConnection.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      dispatch(
        emitSocket("call:accept", {
          receiver: receiverId,
          answer: answer,
        })
      );
      setIncomingCall(null);
      setCallActive(true);
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const rejectCall = () => {
    dispatch(
      emitSocket("call:end", {
        receiver: receiverId,
      })
    );
    setIncomingCall(null);
  };

  const endCall = () => {
    dispatch(
      emitSocket("call:end", {
        receiver: receiverId,
      })
    );
    endCallCleanup();
  };

  const endCallCleanup = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause(); 
    }
    setCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  return {
    isCalling,
    incomingCall,
    callActive,
    isMuted,
    remoteAudioRef, 
    handleCall: startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  };
};

export default useWebRTC;
