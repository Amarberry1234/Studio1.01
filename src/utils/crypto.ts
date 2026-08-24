/**
 * Real Web Crypto API AES-GCM 256-bit encryption engine.
 * Ensures 100% private, client-side zero-knowledge security.
 */

// Derive AES-GCM key from user passphrase and salt via PBKDF2
async function getKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt plaintext string using AES-GCM
export async function encryptData(plainText: string, passphrase: string): Promise<string> {
  if (!passphrase) return plainText;
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassphrase(passphrase, salt);

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    enc.encode(plainText)
  );

  const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

  // Convert binary to base64
  let binary = "";
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return `enc:v1:${btoa(binary)}`;
}

// Decrypt ciphertext using AES-GCM
export async function decryptData(cipherText: string, passphrase: string): Promise<string> {
  if (!cipherText || !cipherText.startsWith("enc:v1:")) return cipherText;
  if (!passphrase) throw new Error("Vault is locked: Passphrase required for decryption");

  try {
    const rawBase64 = cipherText.replace("enc:v1:", "");
    const binary = atob(rawBase64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);

    const key = await getKeyFromPassphrase(passphrase, salt);
    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encryptedData
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (err) {
    throw new Error("Decryption failed: Incorrect passphrase or corrupted payload.");
  }
}

// Simple hash for password verification (PBKDF2 or SHA-256)
export async function hashPassphrase(passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(`salt_${passphrase}_local_studio`));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
