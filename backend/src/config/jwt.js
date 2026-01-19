const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRES_IN;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Please configure JWT_SECRET in environment variables.');
}
if (!JWT_EXPIRE) {
  throw new Error('JWT_EXPIRES_IN is not set. Please configure JWT_EXPIRES_IN in environment variables.');
}

const generateToken = (userId, role = null, isVIP = false) => {
  const payload = { userId };
  if (role) {
    payload.role = role;
  }
  if (isVIP !== undefined && isVIP !== null) {
    payload.isVIP = isVIP;
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRE,
};

