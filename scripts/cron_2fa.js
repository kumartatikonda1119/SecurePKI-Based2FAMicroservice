import fs from "fs";
import { totp } from "otplib";
import base32 from "hi-base32";

const SEED_PATH = "/data/seed.txt";

try {
  if (!fs.existsSync(SEED_PATH)) {
    console.error("Seed not found");
    process.exit(0);
  }

  const seedHex = fs.readFileSync(SEED_PATH, "utf-8").trim();
  const seedBytes = Buffer.from(seedHex, "hex");
  const base32Seed = base32.encode(seedBytes).replace(/=/g, "");

  totp.options = {
    digits: 6,
    step: 30,
    algorithm: "sha1",
  };

  const code = totp.generate(base32Seed);
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);

  console.log(`${now} - 2FA Code: ${code}`);
} catch (err) {
  console.error("Cron error:", err.message);
}
