import fs from "fs";
import crypto from "crypto";

// 1. Read encrypted seed (base64)
const encryptedSeedB64 = fs.readFileSync("encrypted_seed.txt", "utf-8").trim();

// 2. Read private key
const privateKeyPem = fs.readFileSync("student_private.pem", "utf-8");

// 3. Base64 decode
const encryptedBuffer = Buffer.from(encryptedSeedB64, "base64");

// 4. Decrypt using RSA/OAEP + SHA-256
let decrypted;
try {
  decrypted = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedBuffer
  );
} catch (err) {
  console.error("❌ Decryption failed:", err.message);
  process.exit(1);
}

// 5. Convert to UTF-8 string
const seed = decrypted.toString("utf-8").trim();

// 6. Validate seed
const hexRegex = /^[0-9a-f]{64}$/;

if (!hexRegex.test(seed)) {
  console.error("❌ Invalid seed format:", seed);
  process.exit(1);
}

// 7. Print success (DO NOT print seed later in API)
console.log("✅ Seed decrypted successfully");
console.log("Seed length:", seed.length);
