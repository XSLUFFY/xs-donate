const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Token de autenticação não informado."
        });
    }

    const token = authorization.slice(7).trim();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Token de autenticação inválido."
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token inválido ou expirado."
        });
    }
}

module.exports = authMiddleware;
