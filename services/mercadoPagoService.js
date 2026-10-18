```javascript
const express = require("express");
const router = express.Router();

const Donation = require("../models/Donation");
const mercadoPagoService = require("../services/mercadoPagoService");
const socket = require("../socket");
const db = require("../database/db");

router.post(["/", "/mercadopago"], async (req, res) => {
    try {
        const paymentId = req.body?.data?.id || req.query?.["data.id"];
        const type = req.body?.type || req.query?.type;

        // Confirma o recebimento de eventos que não são pagamentos.
        if (type && type !== "payment") {
            return res.sendStatus(200);
        }

        if (!paymentId) {
            return res.sendStatus(200);
        }

        // Consulta o status verdadeiro diretamente no Mercado Pago.
        const payment = await mercadoPagoService.getPayment(paymentId);

        if (!payment || payment.status !== "approved") {
            return res.sendStatus(200);
        }

        let donation = await Donation.findByPaymentId(String(payment.id));

        // O external_reference contém o ID da doação.
        if (!donation && payment.external_reference) {
            const donationId = Number(payment.external_reference);

            if (Number.isInteger(donationId) && donationId > 0) {
                const result = await db.query(
                    "SELECT * FROM donations WHERE id = $1 LIMIT 1",
                    [donationId]
                );

                donation = result.rows[0] || null;
            }
        }

        if (!donation) {
            console.error("Doação não encontrada:", payment.id);
            return res.sendStatus(200);
        }

        // Não dispara novamente um alerta já processado.
        if (donation.status === "approved") {
            return res.sendStatus(200);
        }

        const updatedDonation = await Donation.updateStatus(
            donation.id,
            "approved",
            String(payment.id)
        );

        if (!updatedDonation) {
            console.error("Não foi possível atualizar a doação:", donation.id);
            return res.sendStatus(500);
        }

        // O alerta é enviado somente depois da atualização no banco.
        socket.emitToUser(String(updatedDonation.user_id), "donation", {
            id: updatedDonation.id,
            donor_name: updatedDonation.donor_name,
            donor_message: updatedDonation.donor_message || "Obrigado pela sua doação!",
            amount: Number(updatedDonation.amount),
            status: "approved",
            gif: "/gifs/default.gif",
            duration: 7000
        });

        console.log("Doação aprovada e alerta enviado:", payment.id);
        return res.sendStatus(200);
    } catch (error) {
        console.error("Erro no webhook Mercado Pago:", error.message);
        return res.sendStatus(500);
    }
});

module.exports = router;
```
