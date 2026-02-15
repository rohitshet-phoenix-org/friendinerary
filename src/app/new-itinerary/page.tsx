import NewItineraryForm from "@/components/new-itinerary-form";
import BottomNav from "@/components/bottom-nav";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function NewItinerary() {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">Create New Itinerary</h1>
        <NewItineraryForm />
      </div>
      <BottomNav current="new" />
    </div>
  );
}