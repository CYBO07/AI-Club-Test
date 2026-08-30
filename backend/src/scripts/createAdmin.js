// One-time bootstrap script: creates the initial administrator account.
// Usage: npm run create-admin   (reads INITIAL_ADMIN_* from .env)
import "dotenv/config";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";
import { hashPassword } from "../utils/password.js";

async function run() {
  await connectDB();

  const { INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_PASSWORD } = process.env;

  if (!INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_USERNAME || !INITIAL_ADMIN_PASSWORD) {
    console.error("Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD in .env first.");
    process.exit(1);
  }

  const existing = await Admin.findOne({ $or: [{ email: INITIAL_ADMIN_EMAIL.toLowerCase() }, { username: INITIAL_ADMIN_USERNAME }] });
  if (existing) {
    console.log("An admin with this email or username already exists. No changes made.");
    process.exit(0);
  }

  await Admin.create({
    fullName: INITIAL_ADMIN_NAME || "Administrator",
    email: INITIAL_ADMIN_EMAIL.toLowerCase(),
    username: INITIAL_ADMIN_USERNAME,
    passwordHash: await hashPassword(INITIAL_ADMIN_PASSWORD),
    role: "superadmin",
  });

  console.log("Initial administrator account created successfully.");
  console.log("Username:", INITIAL_ADMIN_USERNAME);
  console.log("Email:", INITIAL_ADMIN_EMAIL);
  console.log("Please log in and change the password immediately.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
