import fs from "fs";
import { totp } from "otplib";
import base32 from "hi-base32";

// 1. Read decrypted seed (hex)
const seedHex = fs.readFileSync("scripts/seed_tmp.txt", "utf-8").trim();

// 2. Convert hex → bytes
const seedBytes = Buffer.from(seedHex, "hex");

// 3. Convert bytes → base32 (CORRECT WAY)
const base32Seed = base32.encode(seedBytes).replace(/=/g, "");

// 4. Configure TOTP
totp.options = {
  digits: 6,
  step: 30,
  algorithm: "sha1",
};

// 5. Generate TOTP
const code = totp.generate(base32Seed);

// 6. Verify with ±1 window
const isValid = totp.check(code, base32Seed);

console.log("Generated TOTP:", code);
console.log("Verification result:", isValid);
