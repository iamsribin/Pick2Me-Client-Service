import axios from "axios";
import { startRefresh, handleLogout } from "../../utils/auth";

const API_VERSION = import.meta.env.VITE_API_VERSION ?? 'v2';
const API_URL = `${import.meta.env.VITE_API_GATEWAY_URL}/${API_VERSION}`;

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => {
    return Promise.reject(error);
  },
)

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    const originalRequest = error.config as any;

    // already-retried requests
    if (!originalRequest || originalRequest._retry) return Promise.reject(error);

    if (error.response?.status === 401 || error.response?.status === 403) {
      originalRequest._retry = true;

      try {
        // ensures only one /refresh call runs concurrently
        await startRefresh(async () => {
          await axios.get(`${API_URL}/refresh`, { withCredentials: true });
        });

        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        console.log("logout err axious",refreshErr);

        await handleLogout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
