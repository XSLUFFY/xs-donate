const { v4: uuidv4 } = require("uuid");

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const API_URL = "https://api.mercadopago.com";

const testMode =
    (process.env.MP_TEST_MODE || "").toLowerCase() === "true";

async function apiRequest(url, options = {}) {
    if (!accessToken) {
        throw new Error(
            "MERCADO_PAGO_ACCESS_TOKEN nao configurado no Render."
        );
    }

    const response = await fetch(API_URL + url, {
        ...options,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + accessToken,
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const detail =
            data.message ||
            data.error ||
            JSON.stringify(data) ||
            "Erro desconhecido";

        console.error(
            "Mercado Pago HTTP " + response.status + ":",
            detail
        );

        throw new Error(
            "Mercado Pago HTTP " +
            response.status +
            ": " +
            String(detail).slice(0, 400)
        );
    }

    return data;
}

async function createPixPayment(donation, payerEmail) {
    if (!donation || !donation.id) {
        throw new Error("Doacao ou ID nao informado.");
    }

    const amount = Number(donation.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Valor da doacao invalido.");
    }

    if (!payerEmail && !testMode) {
        throw new Error("E-mail do pagador nao informado.");
    }

    const payer = testMode
        ? {
            email: "test@testuser.com",
            first_name: "APRO"
        }
        : {
            email: payerEmail
        };

    const orderBody = {
        type: "online",
        external_reference: String(donation.id),
        total_amount: amount.toFixed(2),
        payer: payer,
        transactions: {
            payments: [
                {
                    amount: amount.toFixed(2),
                    payment_method: {
                        id: "pix",
                        type: "bank_transfer"
                    }
                }
            ]
        }
    };

    const order = await apiRequest("/v1/orders", {
        method: "POST",
        headers: {
            "X-Idempotency-Key": uuidv4()
        },
        body: JSON.stringify(orderBody)
    });

    const transaction =
        order.transactions &&
        Array.isArray(order.transactions.payments)
            ? order.transactions.payments[0]
            : {};

    const paymentMethod = transaction.payment_method || {};

    return {
        id: order.id,
        status: order.status || transaction.status || null,
        status_detail:
            order.status_detail || transaction.status_detail || null,
        amount: order.total_amount || transaction.amount || amount.toFixed(2),
        qr_code: paymentMethod.qr_code || null,
        qr_code_base64: paymentMethod.qr_code_base64 || null,
        ticket_url: paymentMethod.ticket_url || null,
        external_reference:
            order.external_reference || String(donation.id)
    };
}

async function getOrder(orderId) {
    if (!orderId) {
        throw new Error("ID da order nao informado.");
    }

    return apiRequest(
        "/v1/orders/" + encodeURIComponent(String(orderId)),
        { method: "GET" }
    );
}

async function getPayment(orderId) {
    return getOrder(orderId);
}

module.exports = {
    createPixPayment,
    getOrder,
    getPayment
};
