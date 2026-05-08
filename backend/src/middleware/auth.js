import { config } from '../config.js';
import { verifyJwt } from '../lib/jwt.js';

export function requireAuth(request, response, next) {
  const authorization = request.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  try {
    request.auth = verifyJwt(token, config.jwtAccessSecret);
    return next();
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.auth) {
      return response.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(request.auth.role)) {
      return response.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}
