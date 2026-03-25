import axios from "axios";
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "friendinerary-storage" });

const BASE_URL = __DEV__ ? "http://localhost:4000/api" : "https://api.friendinerary.com/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach auth token
api.interceptors.request.use((config) => {
  const token = storage.getString("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = storage.getString("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
          storage.set("access_token", data.data.accessToken);
          storage.set("refresh_token", data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          storage.delete("access_token");
          storage.delete("refresh_token");
          storage.delete("user");
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
