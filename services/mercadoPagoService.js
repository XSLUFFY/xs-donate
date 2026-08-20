const { MercadoPagoConfig, Preference } = require("mercadopago");

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

async function createPixPayment(donation) {

    const preference = new Preference(client);

    const response = await preference.create({
        body: {
            items: [
                {
                    title: `Doação para XS Donate`,
                    quantity: 1,
                    currency_id: "BRL",
                    unit_price: Number(donation.amount)
                }
            ],

            payer: {
                name: donation.donor_name
            },

            external_reference: donation.id.toString(),

            notification_url: process.env.WEBHOOK_URL
        }
    });

    return response;
}

module.exports = {
    createPixPayment
};