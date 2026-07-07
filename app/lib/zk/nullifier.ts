/**
 * ZK nullifier derivation (Phase 1 — Poseidon nullifier).
 *
 * nullifier = Poseidon(secret, targetIdHash)
 *   secret       = H(wallet_signature("rate-my-neta-v1"))  — deterministic per wallet
 *   targetIdHash = H(target_id string)                     — politician_id or party_id
 *
 * The nullifier is a 32-byte value stored on-chain in a NullifierAccount PDA.
 * It reveals neither the voter's pubkey nor (directly) the target — but the
 * same wallet + same target always derives the same nullifier, so a second
 * anonymous rating attempt fails on-chain (PDA already exists).
 */

import { poseidonPerm } from "@zk-kit/poseidon-cipher";

/** Fixed message every wallet signs to derive its rating secret. */
export const ZK_SIGN_MESSAGE = "rate-my-neta-v1";

/** BN254 scalar field prime — Poseidon inputs must be reduced into this field. */
const FIELD_PRIME =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function bytesToFieldElement(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value % FIELD_PRIME;
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  );
  return new Uint8Array(digest);
}

function bigintTo32Bytes(value: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

/**
 * Compute the 32-byte nullifier for (wallet signature, target id).
 * Poseidon permutation with state width 3: [capacity, secret, targetIdHash].
 */
export async function computeNullifier(
  walletSignature: Uint8Array,
  targetId: string
): Promise<Uint8Array> {
  const secret = bytesToFieldElement(await sha256(walletSignature));
  const targetIdHash = bytesToFieldElement(
    await sha256(new TextEncoder().encode(targetId))
  );
  const [nullifier] = poseidonPerm([0n, secret, targetIdHash]);
  return bigintTo32Bytes(nullifier % FIELD_PRIME);
}
