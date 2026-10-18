const mercadoPagoService = require("../services/mercadoPagoService");
const Donation = require("../models/Donation");

async function createPix(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Usuário não autenticado."
            });
        }

        const { donationId, email } = req.body || {};

        if (!donationId) {
            return res.status(400).json({
                success: false,
                message: "ID da doação não informado."
            });
        }

        const donations = await Donation.getDonations(req.user.id);

        const donation = donations.find(
            item => String(item.id) === String(donationId)
        );

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Doação não encontrada."
            });
        }

        const payerEmail =
            email || req.user.email || process.env.MP_PAYER_EMAIL;

        if (!payerEmail) {
            return res.status(400).json({
                success: false,
                message: "E-mail do pagador não informado."
            });
        }

        const payment = await mercadoPagoService.createPixPayment(
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
        console.error("Erro ao criar PIX:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Erro ao criar pagamento PIX."
        });
    }
}

async function getPixOrder(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Usuário não autenticado."
            });
        }

        const donationId = req.params.donationId;

        const donations = await Donation.getDonations(req.user.id);

        const donation = donations.find(
            item => String(item.id) === String(donationId)
        );

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Doação não encontrada."
            });
        }

        if (!donation.payment_id) {
            return res.status(409).json({
                success: false,
                message: "Esta doação ainda não tem uma Order PIX."
            });
        }

        const order = await mercadoPagoService.getOrder(
            donation.payment_id
        );

        const transaction =
            order.transactions &&
            Array.isArray(order.transactions.payments)
                ? order.transactions.payments[0] || {}
                : {};

        const method = transaction.payment_method || {};

        return res.json({
            success: true,
            donation: {
                id: donation.id,
                status: donation.status
            },
            order: {
                id: order.id,
                status: order.status || transaction.status || null,
                status_detail:
                    order.status_detail ||
                    transaction.status_detail ||
                    null,
                payment_status: transaction.status || null,
                payment_status_detail:
                    transaction.status_detail || null,
                amount:
                    order.total_amount ||
                    transaction.amount ||
                    donation.amount,
                qr_code: method.qr_code || null,
                qr_code_base64: method.qr_code_base64 || null,
                ticket_url: method.ticket_url || null
            }
        });
    } catch (error) {
        console.error("Erro ao consultar Order PIX:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Erro ao consultar o pagamento."
        });
    }
}

module.exports = {
    createPix,
    getPixOrder
};
