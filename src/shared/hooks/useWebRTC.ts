import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { emitSocket } from "@/shared/utils/emitSocket";
import { toast } from "@/shared/hooks/use-toast";
import { RideDetails } from "../types/common";
import socketService from "../services/socketService";

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
  }, [dispatch, rideDetails]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(peerConnectionConfig);

    pc.onicecandidate = (event:any) => {
      if (event.candidate) {
        dispatch(
          emitSocket("call:ice-candidate", {
            receiver: rideDetails.user?.userId,
            candidate: event.candidate,
          })
        );
      }
    };

    pc.ontrack = (event:any) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
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
          receiver: rideDetails.user?.userId,
          offer: offer,
        })
      );
    } catch (error) {
      console.error("Error starting call:", error);
      setIsCalling(false);
      toast({ description: "Could not access microphone", variant: "error" });
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
          receiver: rideDetails.user?.userId,
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
        receiver: rideDetails.user?.userId,
      })
    );
    setIncomingCall(null);
  };

  const endCall = () => {
    dispatch(
      emitSocket("call:end", {
        receiver: rideDetails.user?.userId,
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
    setCallActive(false);
    setIsCalling(false);
    setIncomingCall(null);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks()[0].enabled = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return {
    isCalling,
    incomingCall,
    callActive,
    isMuted,
    handleCall: startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  };
};

export default useWebRTC;