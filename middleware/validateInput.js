const validateInput = (req, res, next) => {
    const { companyName, contactNumber, ownerName, location, gstin, password } = req.body;
  
    if (!companyName || !contactNumber || !ownerName || !location || !gstin || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    next();
};

module.exports = validateInput;
