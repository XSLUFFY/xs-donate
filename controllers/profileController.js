const profileService = require("../services/profileService");

async function getProfile(req, res) {
    try {

        const profile = await profileService.getProfile(req.user.id);

        return res.json({
            success: true,
            profile
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

async function updateProfile(req, res) {
    try {

        const profile = await profileService.updateProfile(
            req.user.id,
            req.body
        );

        return res.json({
            success: true,
            message: "Perfil atualizado com sucesso.",
            profile
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

module.exports = {
    getProfile,
    updateProfile
};