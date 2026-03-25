import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../../stores/RootStore";

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { auth } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh");
    if (token && refresh) {
      auth.setFromOAuthCallback(token, refresh);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  );
}
