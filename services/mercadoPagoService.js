const { v4: uuidv4 } = require("uuid");

const API_URL = "https://api.mercadopago.com";

function isTestMode() {
    return (process.env.MP_TEST_MODE || "").trim().toLowerCase() === "true";
}

async function apiRequest(url, options = {}) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

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

        console.error("Erro retornado pelo Mercado Pago:", {
            httpStatus: response.status,
            detail
        });

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

    const testMode = isTestMode();

    if (testMode && amount !== 50) {
        throw new Error(
            "O teste predefinido de PIX exige uma doacao de R$ 50,00."
        );
    }

    if (!testMode && !payerEmail) {
        throw new Error("E-mail do pagador nao informado.");
    }

    const payer = testMode
        ? {
            email: "test_user_br@testuser.com",
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
            ? order.transactions.payments[0] || {}
            : {};

    const paymentMethod = transaction.payment_method || {};

    const result = {
        id: order.id,
        status: order.status || transaction.status || null,
        status_detail:
            order.status_detail || transaction.status_detail || null,
        payment_id: transaction.id || null,
        amount: order.total_amount || transaction.amount || amount.toFixed(2),
        qr_code: paymentMethod.qr_code || null,
        qr_code_base64: paymentMethod.qr_code_base64 || null,
        ticket_url: paymentMethod.ticket_url || null,
        external_reference:
            order.external_reference || String(donation.id)
    };

    console.log("Order PIX criada:", {
        order_id: result.id,
        status: result.status,
        status_detail: result.status_detail,
        qr_code_gerado: Boolean(result.qr_code),
        link_pagamento_gerado: Boolean(result.ticket_url)
    });

    return result;
}

async function getOrder(orderId) {
    if (!orderId) {
        throw new Error("ID da order nao informado.");
    }

    return apiRequest(
        "/v1/orders/" + encodeURIComponent(String(orderId)),
        {
            method: "GET"
        }
    );
}

// Mantem compatibilidade com o webhook existente.
async function getPayment(orderId) {
    return getOrder(orderId);
}

module.exports = {
    createPixPayment,
    getOrder,
    getPayment
};
