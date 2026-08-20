const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SALT_ROUNDS = 10;

async function register(name, email, password) {
    const userExists = await User.findByEmail(email);

    if (userExists) {
        throw new Error("E-mail já cadastrado.");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.createUser(
        name,
        email,
        hashedPassword
    );

    return user;
}

async function login(email, password) {
    const user = await User.findByEmail(email);

    if (!user) {
        throw new Error("E-mail ou senha inválidos.");
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        throw new Error("E-mail ou senha inválidos.");
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    };
}

module.exports = {
    register,
    login
};