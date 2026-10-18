const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const Donation = require("../models/Donation");
const mercadoPagoService = require("../services/mercadoPagoService");
const socket = require("../socket");

function validarAssinatura(req, dataId) {
    const secret = (process.env.MP_WEBHOOK_SECRET || "").trim();
    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];

    if (!secret) {
        return { valid: false, reason: "MP_WEBHOOK_SECRET ausente" };
    }

    if (!xSignature || !dataId) {
        return { valid: false, reason: "Cabecalho ou data.id ausente" };
    }

    const parts = {};

    for (const item of xSignature.split(",")) {
        const separator = item.indexOf("=");

        if (separator === -1) continue;

        const key = item.slice(0, separator).trim();
        const value = item.slice(separator + 1).trim();

        if (key && value) {
            parts[key] = value;
        }
    }

    if (!parts.ts || !parts.v1) {
        return { valid: false, reason: "Formato x-signature invalido" };
    }

    // IMPORTANTE: preserva o data.id exatamente como veio na query string.
    const manifestParts = [
        "id:" + String(dataId)
    ];

    if (xRequestId) {
        manifestParts.push("request-id:" + xRequestId);
    }

    manifestParts.push("ts:" + parts.ts);

    const manifest = manifestParts.join(";") + ";";

    const expected = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

    const received = Buffer.from(parts.v1, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
        received.length === 0 ||
        received.length !== expectedBuffer.length
    ) {
        return { valid: false, reason: "Comprimento de assinatura invalido" };
    }

    const valid = crypto.timingSafeEqual(received, expectedBuffer);

    return {
        valid,
        reason: valid ? "ok" : "Hash nao corresponde"
    };
}

router.post("/mercadopago", async (req, res) => {
    try {
        const rawQueryId = req.query["data.id"];
        const queryDataId = Array.isArray(rawQueryId)
            ? rawQueryId[0]
            : rawQueryId;

        const bodyData = req.body?.data;
        const bodyDataId = Array.isArray(bodyData)
            ? bodyData[0]?.id
            : bodyData?.id;

        const orderId = queryDataId || bodyDataId;

        const type = String(
            req.query.type || req.body?.type || ""
        ).toLowerCase();

        console.log("[Webhook] Notificacao recebida:", {
            type,
            action: req.body?.action || null,
            queryDataId: queryDataId || null,
            bodyDataId: bodyDataId || null,
            hasSignature: Boolean(req.headers["x-signature"]),
            hasRequestId: Boolean(req.headers["x-request-id"])
        });

        if (type !== "order" && type !== "orders_v2") {
            return res.sendStatus(200);
        }

        // A assinatura e validada com o data.id da URL, nao do corpo.
        if (!queryDataId) {
            console.warn("[Webhook] Query data.id ausente.");
            return res.sendStatus(401);
        }

        const signature = validarAssinatura(req, queryDataId);

        if (!signature.valid) {
            console.warn(
                "[Webhook] Assinatura invalida:",
                signature.reason
            );
            return res.sendStatus(401);
        }

        if (!orderId) {
            return res.sendStatus(200);
        }

        console.log("[Webhook] Consultando Order:", orderId);

        let order;

        try {
            order = await mercadoPagoService.getOrder(orderId);
        } catch (error) {
            const message = String(error.message || "");

            if (
                message.includes("invalid_path_param") ||
                message.includes("HTTP 400")
            ) {
                console.warn(
                    "[Webhook] O ID recebido nao corresponde a uma Order consultavel."
                );
                return res.sendStatus(200);
            }

            throw error;
        }

        if (String(order.id) !== String(orderId)) {
            console.warn("[Webhook] ID da Order nao corresponde.");
            return res.sendStatus(200);
        }

        const payments = order.transactions?.payments;
        const transaction = Array.isArray(payments)
            ? payments[0] || {}
            : {};

        if (
            order.status !== "processed" ||
            order.status_detail !== "accredited" ||
            transaction.status !== "processed" ||
            transaction.status_detail !== "accredited"
        ) {
            console.log("[Webhook] Order ainda nao creditada:", {
                status: order.status,
                detail: order.status_detail,
                paymentStatus: transaction.status,
                paymentDetail: transaction.status_detail
            });

            return res.sendStatus(200);
        }

        const donationId = Number(order.external_reference);

        if (!Number.isInteger(donationId) || donationId <= 0) {
            console.warn("[Webhook] external_reference invalida.");
            return res.sendStatus(200);
        }

        const donation = await Donation.findById(donationId);

        if (!donation) {
            console.warn("[Webhook] Doacao nao encontrada:", donationId);
            return res.sendStatus(200);
        }

        const expectedAmount = Number(donation.amount);
        const actualAmount = Number(
            transaction.amount || order.total_amount
        );

        if (
            !Number.isFinite(expectedAmount) ||
            !Number.isFinite(actualAmount) ||
            Math.abs(expectedAmount - actualAmount) >= 0.01
        ) {
            console.error("[Webhook] Valor da Order nao corresponde.");
            return res.sendStatus(200);
        }

        if (
            donation.payment_id &&
            String(donation.payment_id) !== String(order.id)
        ) {
            console.error("[Webhook] Order nao corresponde a doacao.");
            return res.sendStatus(200);
        }

        if (donation.status !== "approved") {
            const updated = await Donation.updateStatus(
                donation.id,
                "approved",
                order.id
            );

            if (!updated) {
                throw new Error("Falha ao atualizar o status da doacao.");
            }

            socket.emitToUser(updated.user_id, "donation", {
                id: updated.id,
                donor_name: updated.donor_name,
                donor_message:
                    updated.donor_message ||
                    "Obrigado pela sua doacao!",
                amount: Number(updated.amount),
                status: "approved",
                gif: "/gifs/default.gif",
                duration: 7000
            });

            console.log(
                "[Webhook] Doacao aprovada; alerta emitido:",
                updated.id
            );
        } else {
            console.log("[Webhook] Doacao ja aprovada:", donation.id);
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error("[Webhook] Erro interno:", error);
        return res.sendStatus(500);
    }
});

module.exports = router;
