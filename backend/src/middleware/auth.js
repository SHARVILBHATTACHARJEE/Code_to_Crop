const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  try {
    const bearer = token.split(' ')[1]; // Format: "Bearer <token>"
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized!' });
  }
};

const verifyOfficer = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'Officer' || req.user.role === 'Admin') {
            next();
        } else {
            res.status(403).json({ message: 'Require Officer Role!' });
        }
    });
};

module.exports = { verifyToken, verifyOfficer };
