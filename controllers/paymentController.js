const { MercadoPagoConfig, Payment } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
    accessToken: accessToken || ""
});

const paymentClient = new Payment(client);

async function createPixPayment(donation, payerEmail) {
    if (!donation || !donation.id) {
        throw new Error("Doação ou ID não informado.");
    }

    const amount = Number(donation.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Valor da doação inválido.");
    }

    if (!payerEmail) {
        throw new Error("E-mail do pagador não informado.");
    }

    if (!accessToken) {
        throw new Error("Token do Mercado Pago não configurado no Render.");
    }

    const notificationUrl =
        process.env.WEBHOOK_URL ||
        "https://xs-donate.onrender.com/webhook/mercadopago";

    const response = await paymentClient.create({
        body: {
            transaction_amount: Number(amount.toFixed(2)),
            description: `Doação para XS Donate - ${donation.donor_name}`,
            payment_method_id: "pix",
            payer: {
                email: payerEmail
            },
            external_reference: String(donation.id),
            notification_url: notificationUrl
        },
        requestOptions: {
            idempotencyKey: uuidv4()
        }
    });

    const transactionData =
        response.point_of_interaction?.transaction_data || {};

    return {
        id: response.id,
        status: response.status,
        status_detail: response.status_detail,
        amount: response.transaction_amount,
        qr_code: transactionData.qr_code || null,
        qr_code_base64: transactionData.qr_code_base64 || null,
        ticket_url: transactionData.ticket_url || null,
        external_reference:
            response.external_reference || String(donation.id)
    };
}

async function getPayment(paymentId) {
    if (!paymentId) {
        throw new Error("Payment ID não informado.");
    }

    if (!accessToken) {
        throw new Error("Token do Mercado Pago não configurado no Render.");
    }

    return paymentClient.get({
        id: String(paymentId)
    });
}

module.exports = {
    createPixPayment,
    getPayment
};
