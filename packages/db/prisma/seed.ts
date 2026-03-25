import { PrismaClient } from "../generated/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.info("🌱 Seeding database...");

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@friendinerary.com" },
    update: {},
    create: {
      email: "demo@friendinerary.com",
      displayName: "Demo User",
      passwordHash: createHash("sha256").update("demo123456").digest("hex"),
      authProvider: "email",
      emailVerified: true,
      subscriptionTier: "pro",
      onboardingStatus: "allstar",
      onboardingStepsCompleted: [
        "add_place",
        "view_map",
        "invite_collaborator",
        "set_budget",
        "import_reservation",
      ],
    },
  });

  // Create a sample trip
  const trip = await prisma.trip.upsert({
    where: { slug: "tokyo-adventure-2025" },
    update: {},
    create: {
      slug: "tokyo-adventure-2025",
      name: "Tokyo Adventure 2025",
      ownerId: demoUser.id,
      destinations: ["Tokyo, Japan"],
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-10-08"),
      privacyLevel: "private",
      status: "planning",
      sections: {
        create: [
          {
            type: "ideas",
            name: "Ideas",
            color: "#9CA3AF",
            order: 0,
          },
          {
            type: "day",
            name: "Day 1 — Arrival & Shinjuku",
            date: new Date("2025-10-01"),
            color: "#F97316",
            order: 1,
          },
          {
            type: "day",
            name: "Day 2 — Asakusa & Ueno",
            date: new Date("2025-10-02"),
            color: "#8B5CF6",
            order: 2,
          },
        ],
      },
      budget: {
        create: {
          totalBudget: 3000,
          currency: "USD",
          categoryBudgetsJson: {
            flights: 800,
            accommodation: 700,
            food: 500,
            activities: 500,
            transport: 300,
            shopping: 200,
          },
        },
      },
    },
  });

  console.info(`✅ Created demo user: ${demoUser.email}`);
  console.info(`✅ Created sample trip: ${trip.name}`);
  console.info("🌱 Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
