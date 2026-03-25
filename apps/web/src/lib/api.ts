import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const err = error as { config?: { _retry?: boolean; headers?: Record<string, string>; url?: string }; response?: { status?: number } };
    const originalRequest = err.config;

    if (
      err.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return Promise.reject(error);

      try {
        const { data } = await api.post<{ data: { accessToken: string; refreshToken: string } }>(
          "/auth/refresh",
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefresh);
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return api(originalRequest as Parameters<typeof api>[0]);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
