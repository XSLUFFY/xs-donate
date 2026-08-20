const { MercadoPagoConfig, Payment } = require("mercadopago");
const { v4: uuidv4 } = require("uuid");

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
    console.warn(
        "⚠️ MERCADO_PAGO_ACCESS_TOKEN não configurado."
    );
}

const client = new MercadoPagoConfig({
    accessToken
});

const paymentClient = new Payment(client);


// ==========================================
// CRIAR PAGAMENTO PIX
// ==========================================

async function createPixPayment(donation, payerEmail) {

    if (!donation) {
        throw new Error("Doação não informada.");
    }

    if (!donation.id) {
        throw new Error("ID da doação não informado.");
    }

    const amount = Number(donation.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Valor da doação inválido.");
    }

    if (!payerEmail) {
        throw new Error(
            "E-mail do pagador não informado."
        );
    }

    const idempotencyKey = uuidv4();

    const notificationUrl =
        process.env.WEBHOOK_URL ||
        "https://xs-donate.onrender.com/webhook/mercadopago";

    const body = {

        transaction_amount:
            Number(amount.toFixed(2)),

        description:
            `Doação para XS Donate - ${donation.donor_name}`,

        payment_method_id:
            "pix",

        payer: {
            email: payerEmail
        },

        external_reference:
            String(donation.id),

        notification_url:
            notificationUrl
    };


    console.log("====================================");
    console.log("💳 CRIANDO PAGAMENTO PIX");
    console.log("====================================");

    console.log(
        "Doação:",
        donation.id
    );

    console.log(
        "Valor:",
        body.transaction_amount
    );

    console.log(
        "Doador:",
        donation.donor_name
    );

    console.log(
        "E-mail:",
        payerEmail
    );

    console.log(
        "Webhook:",
        notificationUrl
    );

    console.log("====================================");


    const response =
        await paymentClient.create({

            body,

            requestOptions: {
                idempotencyKey
            }

        });


    console.log("====================================");
    console.log("✅ PIX CRIADO");
    console.log("====================================");

    console.log(
        "Payment ID:",
        response.id
    );

    console.log(
        "Status:",
        response.status
    );

    console.log("====================================");


    const transactionData =
        response.point_of_interaction?.transaction_data || {};


    return {

        id:
            response.id,

        status:
            response.status,

        status_detail:
            response.status_detail,

        amount:
            response.transaction_amount,

        qr_code:
            transactionData.qr_code || null,

        qr_code_base64:
            transactionData.qr_code_base64 || null,

        ticket_url:
            transactionData.ticket_url || null,

        external_reference:
            response.external_reference ||
            String(donation.id)

    };
}


// ==========================================
// CONSULTAR PAGAMENTO
// ==========================================

async function getPayment(paymentId) {

    if (!paymentId) {
        throw new Error(
            "Payment ID não informado."
        );
    }

    const response =
        await paymentClient.get({

            id: String(paymentId)

        });

    return response;
}


// ==========================================
// EXPORTS
// ==========================================

module.exports = {

    createPixPayment,

    getPayment

};
