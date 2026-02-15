"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/home"), 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <h1 className="text-7xl font-bold text-white tracking-tight">Friendinerary</h1>
    </div>
  );
}