// NIP-01 id + BIP-340 verify, hand-rolled (affine BigInt secp256k1, WebCrypto sha256).
// Verify only — the page never signs. Lifted from index.html's gate; ~20ms a check.
const P = 2n**256n - 2n**32n - 977n;
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const G = [0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
           0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n];
const fmod = (a, m) => ((a % m) + m) % m;
function finv(a, m){
  let [r0, r1, s0, s1] = [fmod(a, m), m, 1n, 0n];
  while (r1 !== 0n){ const q = r0 / r1; [r0, r1] = [r1, r0 - q*r1]; [s0, s1] = [s1, s0 - q*s1]; }
  return fmod(s0, m);
}
function padd(A, B){
  if (!A) return B; if (!B) return A;
  if (A[0] === B[0] && fmod(A[1] + B[1], P) === 0n) return null;
  const l = A[0] === B[0] ? fmod(3n*A[0]*A[0] * finv(2n*A[1], P), P)
                          : fmod((B[1]-A[1]) * finv(B[0]-A[0], P), P);
  const x = fmod(l*l - A[0] - B[0], P);
  return [x, fmod(l*(A[0]-x) - A[1], P)];
}
function pmul(Pt, k){
  let R = null, A = Pt;
  while (k > 0n){ if (k & 1n) R = padd(R, A); A = padd(A, A); k >>= 1n; }
  return R;
}
const fpow = (b, e, m) => { let r = 1n; b = fmod(b, m);
  while (e > 0n){ if (e & 1n) r = fmod(r*b, m); b = fmod(b*b, m); e >>= 1n; } return r; };
function liftX(x){                         // x-only key → the even-y point, or null
  if (x <= 0n || x >= P) return null;
  const c = fmod(x*x*x + 7n, P), y = fpow(c, (P + 1n) / 4n, P);
  return fmod(y*y, P) === c ? [x, (y & 1n) ? P - y : y] : null;
}
const hexToBytes = h => Uint8Array.from(h.match(/../g) || [], x => parseInt(x, 16));
const bytesToHex = b => [...b].map(x => x.toString(16).padStart(2, "0")).join("");
const intTo32 = i => hexToBytes(i.toString(16).padStart(64, "0"));
const bcat = (...bs) => { const o = new Uint8Array(bs.reduce((n,b) => n + b.length, 0));
  let at = 0; for (const b of bs){ o.set(b, at); at += b.length; } return o; };
const sha256 = async b => new Uint8Array(await crypto.subtle.digest("SHA-256", b));
async function taggedHash(tag, ...msgs){
  const th = await sha256(new TextEncoder().encode(tag));
  return sha256(bcat(th, th, ...msgs));
}

export async function eventId(ev){
  const ser = JSON.stringify([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content]);
  return bytesToHex(await sha256(new TextEncoder().encode(ser)));
}

export async function schnorrVerify(msgHex, pkHex, sigHex){
  if (!/^[0-9a-f]{64}$/.test(String(pkHex)) || !/^[0-9a-f]{128}$/.test(String(sigHex))) return false;
  const Pk = liftX(BigInt("0x" + pkHex));
  if (!Pk) return false;
  const r = BigInt("0x" + sigHex.slice(0, 64)), s = BigInt("0x" + sigHex.slice(64));
  if (r >= P || s >= N) return false;
  const e = fmod(BigInt("0x" + bytesToHex(await taggedHash("BIP0340/challenge",
    intTo32(r), intTo32(Pk[0]), hexToBytes(msgHex)))), N);
  const R = padd(pmul(G, s), pmul(Pk, N - e));          // R = sG − eP
  return !!R && (R[1] & 1n) === 0n && R[0] === r;
}

// id must be the hash of the event's own bytes, and the sig that pubkey's over the id
export async function verifyEvent(ev){
  if (!ev || !/^[0-9a-f]{64}$/.test(String(ev.id))) return false;
  try { return (await eventId(ev)) === ev.id && await schnorrVerify(ev.id, ev.pubkey, ev.sig); }
  catch { return false; }
}
