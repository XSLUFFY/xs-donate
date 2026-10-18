const mercadoPagoService = require("../services/mercadoPagoService");
const Donation = require("../models/Donation");
const socket = require("../socket");

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

        if (donation.status === "approved") {
            return res.status(409).json({
                success: false,
                message: "Esta doação já foi aprovada."
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

        const donations = await Donation.getDonations(req.user.id);
        const donation = donations.find(
            item => String(item.id) === String(req.params.donationId)
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

        const orderIdMatches =
            String(order.external_reference || "") === String(donation.id);

        const amountPaid = Number(
            transaction.amount || order.total_amount
        );

        const donationAmount = Number(donation.amount);

        const isCredited =
            order.status === "processed" &&
            order.status_detail === "accredited" &&
            transaction.status === "processed" &&
            transaction.status_detail === "accredited" &&
            orderIdMatches &&
            Number.isFinite(amountPaid) &&
            Math.abs(amountPaid - donationAmount) < 0.01;

        let currentDonation = donation;

        if (isCredited && donation.status !== "approved") {
            currentDonation = await Donation.updateStatus(
                donation.id,
                "approved",
                order.id
            );

            if (!currentDonation) {
                throw new Error("Não foi possível atualizar a doação.");
            }

            socket.emitToUser(
                currentDonation.user_id,
                "donation",
                {
                    id: currentDonation.id,
                    donor_name: currentDonation.donor_name,
                    donor_message:
                        currentDonation.donor_message ||
                        "Obrigado pela sua doação!",
                    amount: Number(currentDonation.amount),
                    status: "approved",
                    gif: "/gifs/default.gif",
                    duration: 7000
                }
            );
        }

        return res.json({
            success: true,
            donation: {
                id: currentDonation.id,
                status: currentDonation.status
            },
            order: {
                id: order.id,
                status: order.status || null,
                status_detail: order.status_detail || null,
                payment_status: transaction.status || null,
                payment_status_detail: transaction.status_detail || null,
                qr_code: method.qr_code || null,
                qr_code_base64: method.qr_code_base64 || null,
                ticket_url: method.ticket_url || null
            }
        });
    } catch (error) {
        console.error("Erro ao consultar Order PIX:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Erro ao consultar pagamento."
        });
    }
}

module.exports = {
    createPix,
    getPixOrder
};
