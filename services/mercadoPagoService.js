const { MercadoPagoConfig, Payment } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

const client = new MercadoPagoConfig({
    accessToken: accessToken
});

const paymentClient = new Payment(client);

async function createPixPayment(donation, payerEmail) {
    if (!donation || !donation.id) {
        throw new Error("Doacao ou ID nao informado.");
    }

    const amount = Number(donation.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Valor da doacao invalido.");
    }

    if (!payerEmail) {
        throw new Error("E-mail do pagador nao informado.");
    }

    if (!accessToken) {
        throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado no Render.");
    }

    const notificationUrl =
        process.env.WEBHOOK_URL ||
        "https://xs-donate.onrender.com/webhook/mercadopago";

    const description =
        "Doacao para XS Donate - " +
        String(donation.donor_name || "doador");

    const body = {
        transaction_amount: Number(amount.toFixed(2)),
        description: description,
        payment_method_id: "pix",
        payer: {
            email: payerEmail
        },
        external_reference: String(donation.id),
        notification_url: notificationUrl
    };

    const response = await paymentClient.create({
        body: body,
        requestOptions: {
            idempotencyKey: uuidv4()
        }
    });

    const transactionData =
        response.point_of_interaction &&
        response.point_of_interaction.transaction_data
            ? response.point_of_interaction.transaction_data
            : {};

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
        throw new Error("ID do pagamento nao informado.");
    }

    if (!accessToken) {
        throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado no Render.");
    }

    return paymentClient.get({
        id: String(paymentId)
    });
}

module.exports = {
    createPixPayment: createPixPayment,
    getPayment: getPayment
};
