const authService = require("../services/authService");

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Preencha todos os campos."
            });
        }

        const user = await authService.register(
            name,
            email,
            password
        );

        return res.status(201).json({
            success: true,
            message: "Usuário cadastrado com sucesso.",
            user
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
}

async function login(req, res) {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Informe e-mail e senha."
            });
        }

        const result = await authService.login(
            email,
            password
        );

        return res.status(200).json({
            success: true,
            message: "Login realizado com sucesso.",
            ...result
        });

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: error.message
        });

    }

}

module.exports = {
    register,
    login
};