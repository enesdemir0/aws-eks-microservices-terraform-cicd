const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// This would usually interact with a Model/Database
const loginUser = async (username, password) => {
    // 1. Mock user lookup (We will replace this with DB call later)
    if (username !== 'admin') {
        throw new Error('User not found');
    }

    // 2. Password check (Mocking bcrypt.compare)
    const isMatch = (password === 'password'); 
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // 3. Generate Token
    const token = generateToken({ id: '123', role: 'admin' });
    return { token, user: { username: 'admin' } };
};

module.exports = { loginUser };