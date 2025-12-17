import fs from "fs";
import crypto from "crypto";

// Read inputs
const commitHash = fs.readFileSync("commit_hash.txt", "utf-8").trim();
const studentPrivateKey = fs.readFileSync("student_private.pem", "utf-8");
const instructorPublicKey = fs.readFileSync("instructor_public.pem", "utf-8");

// Sign the commit hash (RSA-PSS + SHA-256)
const signature = crypto.sign("sha256", Buffer.from(commitHash, "utf-8"), {
  key: studentPrivateKey,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN,
});

// Encrypt the signature (RSA-OAEP + SHA-256)
const encryptedSignature = crypto.publicEncrypt(
  {
    key: instructorPublicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  signature
);

// Output single-line base64
console.log(encryptedSignature.toString("base64"));
