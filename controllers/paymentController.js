const mercadoPagoService = require("../services/mercadoPagoService");
const Donation = require("../models/Donation");

async function createPix(req, res) {
    try {
        const { donationId } = req.body;

        if (!donationId) {
            return res.status(400).json({
                success: false,
                message: "ID da doação não informado."
            });
        }

        const donations = await Donation.getDonations(req.user.id);

        const donation = donations.find(d => d.id == donationId);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Doação não encontrada."
            });
        }

        const payment = await mercadoPagoService.createPixPayment(donation);

        return res.json({
            success: true,
            payment
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

module.exports = {
    createPix
};