import jwt from 'jsonwebtoken'

// Authenticate JWT token
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Access token required',
          code: 'NO_TOKEN',
          status: 401
        }
      })
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
      if (err) {
        return res.status(403).json({
          error: {
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
            status: 403
          }
        })
      }

      req.user = user
      next()
    })
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR',
        status: 500
      }
    })
  }
}

