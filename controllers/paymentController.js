```javascript
const mercadoPagoService = require("../services/mercadoPagoService");
const Donation = require("../models/Donation");

async function createPix(req, res) {
    try {
        const { donationId, email } = req.body || {};

        // Confirma se o usuário está autenticado.
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Usuário não autenticado."
            });
        }

        // Valida o ID da doação.
        const parsedDonationId = Number(donationId);

        if (
            !Number.isInteger(parsedDonationId) ||
            parsedDonationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "ID da doação inválido."
            });
        }

        // Busca somente as doações do usuário autenticado.
        const donations = await Donation.getDonations(req.user.id);

        const donation = donations.find(
            (item) => Number(item.id) === parsedDonationId
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

        // Valida o e-mail do pagador.
        const payerEmail = String(
            email || req.user.email || process.env.MP_PAYER_EMAIL || ""
        ).trim();

        if (!payerEmail) {
            return res.status(400).json({
                success: false,
                message: "Informe o e-mail do pagador."
            });
        }

        // Cria o pagamento PIX no Mercado Pago.
        const payment = await mercadoPagoService.createPixPayment(
            donation,
            payerEmail
        );

        if (!payment || !payment.id) {
            throw new Error(
                "O Mercado Pago não retornou o ID do pagamento."
            );
        }

        // Guarda o ID para que o webhook possa localizar a doação.
        await Donation.updateStatus(
            donation.id,
            payment.status || "pending",
            String(payment.id)
        );

        return res.status(200).json({
            success: true,
            payment: {
                id: payment.id,
                status: payment.status,
                status_detail: payment.status_detail,
                amount: payment.amount,
                qr_code: payment.qr_code,
                qr_code_base64: payment.qr_code_base64,
                ticket_url: payment.ticket_url,
                external_reference: payment.external_reference
            }
        });
    } catch (error) {
        console.error(
            "Erro ao criar pagamento PIX:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Não foi possível criar o pagamento PIX."
        });
    }
}

module.exports = {
    createPix
};
```
