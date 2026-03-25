import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../stores/RootStore";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export default function JoinTripPage() {
  const { token } = useParams<{ token: string }>();
  const { auth } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.initialized) return;
    if (!auth.isAuthenticated) {
      navigate(`/login?redirect=/join/${token}`);
      return;
    }
    if (!token) return;

    api.post<{ data: { tripId: string } }>(`/trips/join/${token}`)
      .then(({ data }) => {
        toast.success("You've joined the trip!");
        navigate(`/trip/${data.data.tripId}`);
      })
      .catch(() => {
        toast.error("Invalid or expired invite link");
        navigate("/dashboard");
      });
  }, [auth.initialized, token]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      <p className="ml-4 text-gray-500">Joining trip...</p>
    </div>
  );
}
