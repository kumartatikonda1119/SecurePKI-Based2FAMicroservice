import express from "express";
import fs from "fs";
import crypto from "crypto";
import { totp } from "otplib";
import base32 from "hi-base32";

const app = express();
app.use(express.json());

const PRIVATE_KEY_PATH = "student_private.pem";
const SEED_PATH = "/data/seed.txt";

// Configure TOTP
totp.options = {
  digits: 6,
  step: 30,
  algorithm: "sha1",
};

// POST /decrypt-seed
app.post("/decrypt-seed", (req, res) => {
  try {
    const { encrypted_seed } = req.body;
    if (!encrypted_seed) {
      return res.status(400).json({ error: "Missing encrypted_seed" });
    }

    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf-8");
    const encryptedBuffer = Buffer.from(encrypted_seed, "base64");

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedBuffer
    );

    const seed = decrypted.toString("utf-8").trim();

    if (!/^[0-9a-f]{64}$/.test(seed)) {
      throw new Error("Invalid seed format");
    }

    fs.mkdirSync("/data", { recursive: true });
    fs.writeFileSync(SEED_PATH, seed);

    return res.json({ status: "ok" });
  } catch (err) {
    return res.status(500).json({ error: "Decryption failed" });
  }
});

// GET /generate-2fa
app.get("/generate-2fa", (req, res) => {
  try {
    if (!fs.existsSync(SEED_PATH)) {
      return res.status(500).json({ error: "Seed not decrypted yet" });
    }

    const seedHex = fs.readFileSync(SEED_PATH, "utf-8").trim();
    const seedBytes = Buffer.from(seedHex, "hex");
    const base32Seed = base32.encode(seedBytes).replace(/=/g, "");

    const code = totp.generate(base32Seed);
    const validFor = 30 - (Math.floor(Date.now() / 1000) % 30);

    return res.json({ code, valid_for: validFor });
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate 2FA" });
  }
});

// POST /verify-2fa
app.post("/verify-2fa", (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    if (!fs.existsSync(SEED_PATH)) {
      return res.status(500).json({ error: "Seed not decrypted yet" });
    }

    const seedHex = fs.readFileSync(SEED_PATH, "utf-8").trim();
    const seedBytes = Buffer.from(seedHex, "hex");
    const base32Seed = base32.encode(seedBytes).replace(/=/g, "");

    const valid = totp.check(code, base32Seed, { window: 1 });

    return res.json({ valid });
  } catch (err) {
    return res.status(500).json({ error: "Verification failed" });
  }
});

// Start server
app.listen(8080, "0.0.0.0", () => {
  console.log("API listening on port 8080");
});
