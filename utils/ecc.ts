// Elliptic Curve Cryptography Implementation from Scratch
// Curve Equation: y^2 = x^3 + ax + b (mod p)

export interface Point {
  x: bigint | null;
  y: bigint | null;
  isInfinity: boolean;
}

export interface CurveParams {
  a: bigint;
  b: bigint;
  p: bigint;
  G: Point; // Generator point
  n: bigint; // Order of G
}

// Pre-defined "Educational" Curve (Small numbers for visualization)
export const TOY_CURVE: CurveParams = {
  a: 1n,
  b: 6n,
  p: 11n, // Prime field
  G: { x: 2n, y: 4n, isInfinity: false },
  n: 13n // Order
};

// Larger "Demo" Curve (Better for encryption demo)
// E: y^2 = x^3 + 2x + 2 (mod 1021)
export const DEMO_CURVE: CurveParams = {
  a: 2n,
  b: 2n,
  p: 1021n,
  G: { x: 5n, y: 195n, isInfinity: false },
  n: 1039n
};

// --- Modular Arithmetic Helpers ---

// Modulo that handles negative numbers correctly
export const mod = (n: bigint, p: bigint): bigint => {
  return ((n % p) + p) % p;
};

// Extended Euclidean Algorithm for Modular Inverse
// Returns x such that a*x = 1 (mod m)
export const modInverse = (a: bigint, m: bigint): bigint => {
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];
  let [old_t, t] = [0n, 1n];

  while (r !== 0n) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
    [old_t, t] = [t, old_t - quotient * t];
  }

  if (old_r !== 1n) {
    throw new Error('模逆元不存在');
  }

  return mod(old_s, m);
};

// Modular Exponentiation: base^exp % mod
export const modPow = (base: bigint, exp: bigint, m: bigint): bigint => {
  let res = 1n;
  base = mod(base, m);
  let e = exp;
  while (e > 0n) {
    if (e % 2n === 1n) res = mod(res * base, m);
    base = mod(base * base, m);
    e /= 2n;
  }
  return res;
};

// Modular Square Root (Tonelli-Shanks is complex, using simple brute force for small p 
// or p = 3 mod 4 optimization for larger p).
// For this demo, we assume p = 3 mod 4 for efficiency if possible, else brute force for small numbers.
export const modSqrt = (a: bigint, p: bigint): bigint | null => {
  a = mod(a, p);
  // Optimization for p = 3 mod 4
  if (p % 4n === 3n) {
    const r = modPow(a, (p + 1n) / 4n, p);
    if (mod(r * r, p) === a) return r;
    return null;
  }
  
  // Brute force for educational curves (sufficient for p < 10000)
  for (let i = 1n; i < p; i++) {
    if (mod(i * i, p) === a) return i;
  }
  return null;
};

// --- Point Arithmetic ---

export const isInfinity = (P: Point): boolean => P.isInfinity;

// Point Addition: R = P + Q
export const pointAdd = (P: Point, Q: Point, curve: CurveParams, log?: (s: string) => void): Point => {
  if (P.isInfinity) return Q;
  if (Q.isInfinity) return P;
  if (!P.x || !P.y || !Q.x || !Q.y) return { x: null, y: null, isInfinity: true };

  const { p, a } = curve;

  // P == -Q (Vertical line)
  if (P.x === Q.x && P.y !== Q.y) {
    log?.(`P + Q = 无穷远点 (垂直线)`);
    return { x: null, y: null, isInfinity: true };
  }

  let lambda: bigint;

  if (P.x === Q.x && P.y === Q.y) {
    // Point Doubling: slope = (3x^2 + a) / (2y)
    if (P.y === 0n) return { x: null, y: null, isInfinity: true }; // Tangent is vertical
    const num = mod(3n * P.x * P.x + a, p);
    const den = modInverse(2n * P.y, p);
    lambda = mod(num * den, p);
    log?.(`倍点 P: λ = (3*${P.x}^2 + ${a}) / (2*${P.y}) = ${num} * ${den} mod ${p} = ${lambda}`);
  } else {
    // Point Addition: slope = (y2 - y1) / (x2 - x1)
    const num = mod(Q.y - P.y, p);
    const den = modInverse(mod(Q.x - P.x, p), p);
    lambda = mod(num * den, p);
    log?.(`点加 P+Q: λ = (${Q.y} - ${P.y}) / (${Q.x} - ${P.x}) = ${num} * ${den} mod ${p} = ${lambda}`);
  }

  const x3 = mod(lambda * lambda - P.x - Q.x, p);
  const y3 = mod(lambda * (P.x - x3) - P.y, p);

  log?.(`结果: (${x3}, ${y3})`);
  return { x: x3, y: y3, isInfinity: false };
};

// Scalar Multiplication: R = k * P (Double and Add)
export const pointMultiply = (k: bigint, P: Point, curve: CurveParams, log?: (s: string) => void): Point => {
  let R: Point = { x: null, y: null, isInfinity: true }; // Identity
  let N = P;
  let scalar = k;

  const bits = scalar.toString(2);
  log?.(`标量乘法: k=${k} (二进制: ${bits})`);

  for (let i = bits.length - 1; i >= 0; i--) {
    if (bits[i] === '1') {
      log?.(`第 2^${bits.length - 1 - i} 位是 1。将当前点 N 加到结果中。`);
      R = pointAdd(R, N, curve);
    }
    log?.(`为下一位对 N 进行倍点运算。`);
    N = pointAdd(N, N, curve);
  }

  return R;
};

// --- Encryption / Embedding Helpers ---

// Check if a number is a valid x-coordinate on the curve
const isValidX = (x: bigint, curve: CurveParams): { valid: boolean, y: bigint | null } => {
  const rhs = mod(x ** 3n + curve.a * x + curve.b, curve.p);
  const y = modSqrt(rhs, curve.p);
  return { valid: y !== null, y };
};

// Method 1: Koblitz Method (Standard)
// Embed m into x = m*K + j
export const embedMessageKoblitz = (message: bigint, curve: CurveParams, K: bigint = 20n): Point => {
  for (let j = 0n; j < K; j++) {
    const x = message * K + j;
    const { valid, y } = isValidX(x, curve);
    if (valid && y !== null) {
      return { x, y, isInfinity: false };
    }
  }
  throw new Error("无法嵌入消息 (Koblitz)");
};

// Un-embed Method 1
export const unembedMessageKoblitz = (P: Point, K: bigint = 20n): bigint => {
  if (P.isInfinity || P.x === null) throw new Error("无效点");
  return P.x / K;
};

// Method 2: Direct Search (Simple Increment)
// Try x = m, then m+1, m+2...
// Note: This modifies the message value slightly but ensures a point is found near the message.
export const embedMessageDirect = (message: bigint, curve: CurveParams): { point: Point, offset: bigint } => {
  let offset = 0n;
  // Safety break after 100 tries
  while (offset < 100n) {
    const x = message + offset;
    const { valid, y } = isValidX(x, curve);
    if (valid && y !== null) {
      return { point: { x, y, isInfinity: false }, offset };
    }
    offset++;
  }
  throw new Error("无法嵌入消息 (直接搜索)");
};