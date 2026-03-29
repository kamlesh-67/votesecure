import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================================
  // 1. ElectionConfig Singleton
  // ============================================================
  const electionConfig = await prisma.electionConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      title: "Election 2025",
      isClosed: false,
    },
  });
  console.log("✅ ElectionConfig seeded:", electionConfig.title);

  // ============================================================
  // 2. Super Admin
  // ============================================================
  const existingAdmin = await prisma.admin.findUnique({
    where: { mobile: "9999999999" },
  });

  if (!existingAdmin) {
    const superAdmin = await prisma.admin.create({
      data: {
        name: "Super Admin",
        mobile: "9999999999", // Replace with real admin mobile
        role: "super_admin",
        isActive: true,
      },
    });
    console.log("✅ Super Admin seeded:", superAdmin.name, `(${superAdmin.mobile})`);
  } else {
    console.log("ℹ️  Super Admin already exists, skipping.");
  }

  // ============================================================
  // 3. Sample Candidates (for testing)
  // ============================================================
  const candidates = [
    {
      serialNumber: 1,
      name: "Arjun Sharma",
      position: "President",
      party: "Progressive Alliance",
      bio: "Committed to transparency and student welfare.",
      displayOrder: 1,
      isNota: false,
    },
    {
      serialNumber: 2,
      name: "Priya Nair",
      position: "President",
      party: "National Unity Front",
      bio: "Advocate for inclusive governance and youth empowerment.",
      displayOrder: 2,
      isNota: false,
    },
    {
      serialNumber: 3,
      name: "Rahul Verma",
      position: "President",
      party: "Reform Coalition",
      bio: "Focused on digital transformation and accountability.",
      displayOrder: 3,
      isNota: false,
    },
    {
      serialNumber: 99,
      name: "None of the Above",
      position: null,
      party: null,
      bio: "Abstain from voting for any candidate.",
      displayOrder: 99,
      isNota: true,
    },
  ];

  for (const candidate of candidates) {
    await prisma.candidate.upsert({
      where: { serialNumber: candidate.serialNumber },
      update: {},
      create: {
        ...candidate,
        isActive: true,
      },
    });
    console.log(`✅ Candidate seeded: ${candidate.name}`);
  }

  // ============================================================
  // 4. Sample Voter (for testing — mobile: 9876543210)
  // ============================================================
  const existingVoter = await prisma.voter.findUnique({
    where: { mobile: "9876543210" },
  });

  if (!existingVoter) {
    await prisma.voter.create({
      data: {
        name: "Test Voter",
        mobile: "9876543210",
        isActive: true,
        hasVoted: false,
      },
    });
    console.log("✅ Test Voter seeded: 9876543210");
  } else {
    console.log("ℹ️  Test Voter already exists, skipping.");
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Super Admin mobile: 9999999999");
  console.log("Test Voter mobile:  9876543210");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚠️  Remember: OTP is logged to console in dev mode.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
