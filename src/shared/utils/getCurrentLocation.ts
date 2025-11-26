// export const getCurrentLocation = (): Promise<{latitude: number; longitude: number}> => {
//   return new Promise((resolve, reject) => {
//     if (!navigator.geolocation) {
//       reject(new Error("Geolocation not supported"));
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         resolve({
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//         });
//       },
//       (error) => {
//         console.log(error);

//         reject(error);
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 0,
//       }
//     );
//   });
// };

import { toast } from "../hooks/use-toast";
export type LocationResult = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export class GeolocationError extends Error {
  public code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = "GeolocationError";
    this.code = code;
  }
}

const defaultOptions = {
  coarseTimeoutMs: 5000,
  highTimeoutMs: 20000,
  desiredAccuracyMeters: 150,
};

function getPositionOnce(
  enableHighAccuracy: boolean,
  timeoutMs: number
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new GeolocationError(2, "Geolocation not supported by this browser")
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        reject(
          new GeolocationError(err.code, err.message || "Geolocation error")
        );
      },
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
}


export async function getCurrentLocation(
  opts?: Partial<typeof defaultOptions>
): Promise<LocationResult> {
  const { coarseTimeoutMs, highTimeoutMs, desiredAccuracyMeters } = {
    ...defaultOptions,
    ...opts,
  };


    if (
      navigator.permissions &&
      typeof navigator.permissions.query === "function"
    ) {
      const status = await (navigator.permissions as any).query({
        name: "geolocation",
      });
      if (status && status.state === "denied") {
        toast({
          description:
            "Location permission denied. Please enable location in browser settings.",
          variant: "error",
        });
        throw new GeolocationError(1, "Location permission denied");
      }
    }


  let coarsePos: GeolocationPosition | null = null;

  // 1) quick coarse attempt
  try {
    const pos = await getPositionOnce(false, coarseTimeoutMs);
    coarsePos = pos;
    const accuracy = pos.coords.accuracy ?? Infinity;
    
    if (accuracy <= desiredAccuracyMeters) {
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy,
      };
    }
  } catch (err) {
    if (err instanceof GeolocationError && (err.code === 1 || err.code === 2)) {
      throw err;
    }
  }

  // 2) high-accuracy attempt
  try {
    const pos = await getPositionOnce(true, highTimeoutMs);
    const accuracy = pos.coords.accuracy ?? Infinity;
    if (accuracy <= desiredAccuracyMeters) {
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy,
      };
    }


    // toast({
    //   description: `Location obtained but accuracy is ${Math.round(
    //     accuracy
    //   )}m — move to an open area for a more precise fix.`,
    //   variant: "warning",
    // });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy,
    };
  } catch (err) {
    if (err instanceof GeolocationError && (err.code === 1 || err.code === 2)) {
      throw err;
    }


    if (coarsePos) {
      const cAcc = coarsePos.coords.accuracy ?? Infinity;
      toast({
        description:
          "Could not get a high-accuracy GPS fix. Using a quick location which may be less precise. Try moving outside for a better result.",
        variant: "warning",
      });
      return {
        latitude: coarsePos.coords.latitude,
        longitude: coarsePos.coords.longitude,
        accuracy: cAcc,
      };
    }

    toast({
      description:
        "Unable to obtain location. Try again or enter your pickup location manually.",
      variant: "error",
    });
    throw new GeolocationError(3, "Timeout while getting location");
  }
}
