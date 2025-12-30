const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

/**
 * Middleware to verify JWT token and attach user info to request
 */
function authenticateToken(req, res, next) {
  // Get token from Authorization header or from request body
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // If no token in header, try to get from body (for backward compatibility)
  if (!token && req.body && req.body.token) {
    const decoded = jwt.verify(req.body.token, JWT_SECRET);
    req.user = decoded;
    return next();
  }

  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Access token required',
        code: 'NO_TOKEN',
        status: 401
      }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: {
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        status: 403
      }
    });
  }
}

module.exports = { authenticateToken };

