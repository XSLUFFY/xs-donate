const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const Donation = require("../models/Donation");
const mercadoPagoService = require("../services/mercadoPagoService");
const socket = require("../socket");

function validarAssinatura(req, dataId) {
    const secret = process.env.MP_WEBHOOK_SECRET;

    if (!secret) {
        throw new Error("MP_WEBHOOK_SECRET nao configurado no Render.");
    }

    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];

    if (!xSignature || !xRequestId || !dataId) {
        return false;
    }

    const parts = {};

    for (const item of xSignature.split(",")) {
        const [key, value] = item.trim().split("=", 2);

        if (key && value) {
            parts[key] = value;
        }
    }

    if (!parts.ts || !parts.v1) {
        return false;
    }

    const manifest =
        "id:" + String(dataId).toLowerCase() +
        ";request-id:" + xRequestId +
        ";ts:" + parts.ts +
        ";";

    const expected = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

    const receivedBuffer = Buffer.from(parts.v1, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (receivedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

router.post("/mercadopago", async (req, res) => {
    try {
        const type = String(
            req.query.type || req.body?.type || ""
        ).toLowerCase();

        // Este endpoint processa notificacoes da Orders API.
        if (type !== "order" && type !== "orders_v2") {
            return res.sendStatus(200);
        }

        const queryDataId = req.query["data.id"];
        const orderId = queryDataId || req.body?.data?.id;

        if (!orderId) {
            console.warn("Webhook recebido sem ID da order.");
            return res.sendStatus(200);
        }

        if (!validarAssinatura(req, queryDataId)) {
            console.warn("Assinatura do webhook invalida ou ausente.");
            return res.sendStatus(401);
        }

        // Consultamos a API para confirmar o estado real da order.
        const order = await mercadoPagoService.getOrder(orderId);

        if (String(order.id) !== String(orderId)) {
            console.error("O ID da order consultada nao corresponde.");
            return res.sendStatus(200);
        }

        // Somente uma order processada e creditada aprova a doacao.
        if (
            order.status !== "processed" ||
            order.status_detail !== "accredited"
        ) {
            console.log(
                "Order ainda nao creditada:",
                order.status,
                order.status_detail
            );

            return res.sendStatus(200);
        }

        let donation = await Donation.findByPaymentId(order.id);

        if (!donation && order.external_reference) {
            const donationId = Number(order.external_reference);

            if (Number.isInteger(donationId) && donationId > 0) {
                donation = await Donation.findById(donationId);
            }
        }

        if (!donation) {
            console.error(
                "Doacao nao encontrada para a order:",
                order.id
            );

            return res.sendStatus(200);
        }

        // Confere o valor antes de aprovar a doacao.
        const orderAmount = Number(
            order.total_paid_amount ?? order.total_amount
        );

        const donationAmount = Number(donation.amount);

        if (
            !Number.isFinite(orderAmount) ||
            !Number.isFinite(donationAmount) ||
            Math.abs(orderAmount - donationAmount) > 0.009
        ) {
            console.error(
                "Valor da order diferente da doacao:",
                order.id
            );

            return res.sendStatus(200);
        }

        // Evita emitir alertas duplicados em notificacoes repetidas.
        if (donation.status === "approved") {
            return res.sendStatus(200);
        }

        const updatedDonation = await Donation.updateStatus(
            donation.id,
            "approved",
            order.id
        );

        if (!updatedDonation) {
            throw new Error("Nao foi possivel atualizar a doacao.");
        }

        socket.emitToUser(
            updatedDonation.user_id,
            "donation",
            {
                id: updatedDonation.id,
                donor_name: updatedDonation.donor_name,
                donor_message:
                    updatedDonation.donor_message ||
                    "Obrigado pela sua doacao!",
                amount: Number(updatedDonation.amount),
                status: "approved",
                gif: "/gifs/default.gif",
                duration: 7000
            }
        );

        console.log(
            "Doacao aprovada e alerta enviado:",
            updatedDonation.id
        );

        return res.sendStatus(200);
    } catch (error) {
        console.error("Erro no webhook do Mercado Pago:", error);
        return res.sendStatus(500);
    }
});

module.exports = router;
