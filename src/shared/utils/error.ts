import { toast } from "@/shared/hooks/use-toast";
import axios from "axios";

type ThrownError = {
  status: number;
  message: string;
};


const isAbortError = (err: any): boolean => {
  return (
    err?.name === 'AbortError' ||
    err?.code === 'ERR_CANCELED' ||
    err?.message?.includes('cancel') ||
    axios.isCancel(err)
  );
};


export const throwCustomError = (err: any): never => {
  if (isAbortError(err)) throw err;
console.log("ppppppp",err);

  if (err?.response) {
    const { status, data } = err.response;
    const message = data?.message || "An unexpected error occurred!";
    const e = new Error(message) as Error & { status?: number; original?: any };
    e.status = status;
    e.original = err;
    throw e;
  }

  const e = new Error(err?.message || "An unexpected error occurred!") as Error & { status?: number; original?: any };
  e.status = -1;
  e.original = err;
  throw e;
};



export const handleCustomError = (err: any) => {
  if (isAbortError(err)) {
    console.log("Request cancelled, ignoring error");
    return; // no toast for cancelled requests
  }

  console.log("handleCustomErrouyuyr", err);

  const status: number =
    typeof err?.status === "number" ? 
    err.status : typeof err?.response?.status === "number" ? 
    err.response.status
      : -1;

  const message: string =
    err?.message ||
    err?.response?.data?.message ||
    (err?.response && JSON.stringify(err.response.data)) ||
    "An unexpected error occurred!";

  let title = "Error ❌";
  let variant: "default" | "error" | "info" | "warning" | "success" | "destructive" =
    "error";
  const description = message;
console.log("satatt",status);

  switch (status) {
    case 400:
      title = "Bad request";
      variant = "error";
      break;
    case 401:
      title = "Unauthorized";
      variant = "error";
      break;
    case 403:
      title = "Forbidden";
      variant = "error";
      break;
    case 404:
      title = "Not found";
      variant = "warning";
      break;
    case 409:
      title = "Conflict";
      variant = "warning";
      break;
    case 410:
      title = "Resource gone";
      variant = "info";
      break;
    case 500:
      title = "Server error";
      variant = "default";
      break;
    case 501:
    case 504:
      title = "Network or server issue";
      variant = "error";
      break;
    case 0:
      title = "Network error";
      variant = "info";
      break;
    case -1:
    default:
      title = "Something went wrong";
      variant = "error";
      break;
  }

  toast({
    title,
    description,
    variant,
  });
};