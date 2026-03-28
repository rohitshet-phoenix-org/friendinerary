import OpenAI from "openai";

function getOpenAI() {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey: key });
}

interface ParsedReservation {
  type: "flight" | "hotel" | "rental_car" | "activity";
  details: Record<string, unknown>;
}

export async function parseEmailReservation(
  emailText: string,
  _emailHtml?: string
): Promise<ParsedReservation | null> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: process.env["OPENAI_MODEL"] ?? "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a travel reservation parser. Extract reservation details from confirmation emails.
Return a JSON object with:
{
  "type": "flight" | "hotel" | "rental_car" | "activity",
  "details": { ...type-specific fields }
}

For flight: { flightNumber, airline, departureAirport, arrivalAirport, departureTime (ISO), arrivalTime (ISO), confirmationCode, seatNumber, cabinClass }
For hotel: { hotelName, address, checkInDate (ISO), checkOutDate (ISO), confirmationCode, roomType, guestCount }
For rental_car: { vendor, pickupLocation, dropoffLocation, pickupTime (ISO), dropoffTime (ISO), confirmationCode, carClass }
For activity: { activityName, location, startTime (ISO), endTime (ISO), confirmationCode, provider }

Return null if this is not a travel reservation email.`,
        },
        {
          role: "user",
          content: emailText.slice(0, 4000),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const content = response.choices[0]?.message.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as ParsedReservation;
    if (!parsed.type || !parsed.details) return null;

    return parsed;
  } catch {
    return null;
  }
}
