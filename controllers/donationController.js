const donationService = require("../services/donationService");

async function createDonation(req, res) {
    try {
        const donation = await donationService.createDonation(
            req.user.id,
            req.body
        );

        return res.status(201).json({
            success: true,
            donation
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function getDonations(req, res) {
    try {
        const donations = await donationService.getDonations(req.user.id);

        return res.json({
            success: true,
            donations
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    createDonation,
    getDonations
};