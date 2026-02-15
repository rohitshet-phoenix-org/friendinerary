"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useSupabase } from "@/components/supabase-provider";
import { useRouter } from "next/navigation";
import { OpenAI } from "openai";

const schema = z.object({
  destinations: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  people: z.number().min(1),
  visibility: z.enum(["private", "public"]),
  preferences: z.string().optional(),
});

export default function NewItineraryForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const supabase = useSupabase();
  const router = useRouter();

  const onSubmit = async (data: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const destinations = data.destinations.split(",").map((d: string) => d.trim());

    // Check limit
    const { count } = await supabase.from("itineraries").select("*", { count: "exact" }).eq("user_id", user?.id);
    const { data: profile } = await supabase.from("profiles").select("is_pro").eq("id", user?.id).single();
    if (count >= 5 && !profile?.is_pro) {
      alert("Upgrade to Pro for unlimited itineraries!");
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
    const prompt = `Generate a detailed day-by-day travel itinerary for ${data.people} people visiting ${destinations.join(", ")} from ${data.startDate} to ${data.endDate}. 
    Include attractions, meals, local transport. ${data.preferences ? "Additional requests: " + data.preferences : ""} 
    Format as clean markdown with ## Day X headings.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
    });

    const content = completion.choices[0].message.content;

    const { data: itinerary } = await supabase.from("itineraries").insert({
      user_id: user?.id,
      title: `${destinations.join(" → ")} Trip`,
      destinations,
      start_date: data.startDate,
      end_date: data.endDate,
      number_of_people: data.people,
      visibility: data.visibility,
      preferences: data.preferences,
      content,
    }).select().single();

    router.push(`/itinerary/${itinerary.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form fields: destinations, dates (type=date), people, visibility select, preferences textarea */}
      <Button type="submit" className="w-full">Generate Itinerary</Button>
    </form>
  );
}