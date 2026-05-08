import crypto from 'node:crypto';

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = value => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

function signInput(header, payload) {
  return `${encode(header)}.${encode(payload)}`;
}

function createSignature(input, secret) {
  return crypto.createHmac('sha256', secret).update(input).digest('base64url');
}

export function signJwt(payload, secret, expiresInSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const input = signInput(header, body);
  return `${input}.${createSignature(input, secret)}`;
}

export function verifyJwt(token, secret) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token');
  }

  const input = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createSignature(input, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid token signature');
  }

  const payload = decode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
}

export function signState(payload, secret) {
  return signJwt(payload, secret, 300);
}

export function verifyState(token, secret) {
  return verifyJwt(token, secret);
}
