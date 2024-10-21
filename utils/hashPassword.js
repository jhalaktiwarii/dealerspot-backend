const argon2 = require('argon2');

// Function to hash passwords
const hashPassword = async (password) => {
    return await argon2.hash(password);
};

// Function to verify password
const verifyPassword = async (hashedPassword, inputPassword) => {
    return await argon2.verify(hashedPassword, inputPassword);
};

module.exports = { hashPassword, verifyPassword };
