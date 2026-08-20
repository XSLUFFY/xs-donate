const mercadoPagoService = require("../services/mercadoPagoService");
const Donation = require("../models/Donation");

async function createPix(req, res) {
    try {
        const { donationId, email } = req.body;

        if (!donationId) {
            return res.status(400).json({
                success: false,
                message: "ID da doação não informado."
            });
        }

        const donations = await Donation.getDonations(req.user.id);

        const donation = donations.find(
            d => String(d.id) === String(donationId)
        );

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Doação não encontrada."
            });
        }

        const payerEmail =
            email ||
            req.user.email ||
            process.env.MP_PAYER_EMAIL;

        if (!payerEmail) {
            return res.status(400).json({
                success: false,
                message: "E-mail do pagador não informado."
            });
        }

        const payment =
            await mercadoPagoService.createPixPayment(
                donation,
                payerEmail
            );

        if (payment.id) {
            await Donation.updateStatus(
                donation.id,
                "pending",
                payment.id
            );
        }

        return res.json({
            success: true,
            payment
        });

    } catch (error) {
        console.error("❌ Erro ao criar PIX:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Erro ao criar pagamento PIX."
        });
    }
}

module.exports = {
    createPix
};
