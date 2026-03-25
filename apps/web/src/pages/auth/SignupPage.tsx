import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/RootStore";
import toast from "react-hot-toast";
import { MapPin } from "lucide-react";

const SignupPage = observer(() => {
  const { auth } = useStore();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await auth.signup(email, password, displayName);
      toast.success("Account created! Welcome to Friendinerary 🎉");
      navigate("/dashboard");
    } catch {
      toast.error(auth.error ?? "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <MapPin className="w-8 h-8 text-brand-500" />
            <span className="text-2xl font-bold text-gray-900">Friendinerary</span>
          </Link>
          <p className="text-gray-500 mt-2">Start planning your next adventure.</p>
        </div>

        <div className="card p-8">
          <button
            onClick={() => (window.location.href = "/api/auth/google")}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
            Sign up with Google
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input type="text" className="input" placeholder="Jane Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="input" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" disabled={auth.loading} className="btn-primary w-full">
              {auth.loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium">Sign in</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
});

export default SignupPage;
