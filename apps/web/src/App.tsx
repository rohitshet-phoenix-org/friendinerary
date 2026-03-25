import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "./stores/RootStore";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import TripPage from "./pages/trip/TripPage";
import ExplorePage from "./pages/ExplorePage";
import ProPage from "./pages/ProPage";
import PinboardPage from "./pages/PinboardPage";
import SettingsPage from "./pages/SettingsPage";
import JoinTripPage from "./pages/JoinTripPage";
import StoryPage from "./pages/StoryPage";
import NotFoundPage from "./pages/NotFoundPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useStore();
  if (!auth.initialized) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = observer(() => {
  const { auth, ui } = useStore();

  useEffect(() => {
    auth.initialize();
  }, [auth]);

  // Apply dark mode
  useEffect(() => {
    if (ui.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [ui.darkMode]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/join/:token" element={<JoinTripPage />} />
      <Route path="/story/:shareSlug" element={<StoryPage />} />
      <Route path="/pro" element={<ProPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/trip/:tripId/*" element={<PrivateRoute><TripPage /></PrivateRoute>} />
      <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
      <Route path="/pinboard" element={<PrivateRoute><PinboardPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
});

export default App;
