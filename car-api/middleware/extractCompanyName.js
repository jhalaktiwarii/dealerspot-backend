const jwt = require('jsonwebtoken');

const extractCompanyName = (req, res, next) => {
   const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
     return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.companyName = decoded.companyName;
    console.log('Extracted company name:', req.companyName); // Add this line for debugging
    next();
  } catch (error) {
    console.error('Error decoding token:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', tokenExpired: true });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = extractCompanyName;
