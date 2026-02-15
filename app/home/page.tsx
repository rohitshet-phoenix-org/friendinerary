import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import SampleCards from "@/components/sample-cards";
import BottomNav from "@/components/bottom-nav";
import LoginButton from "@/components/login-button";

export default async function Home() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-6">
        <h1 className="mb-8 text-center text-4xl font-bold">Discover Your Next Adventure</h1>
        <SampleCards />
        {!session && <LoginButton />}
      </div>
      {session && <BottomNav current="home" />}
    </div>
  );
}