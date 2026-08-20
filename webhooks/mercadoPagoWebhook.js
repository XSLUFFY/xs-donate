const express = require("express");
const router = express.Router();

const Donation = require("../models/Donation");
const socket = require("../socket");

// Futuramente criaremos este serviço
// const mercadoPagoService = require("../services/mercadoPagoService");

router.post("/mercadopago", async (req, res) => {

    try {

        console.log("==================================");
        console.log("WEBHOOK MERCADO PAGO");
        console.log("==================================");
        console.log(req.body);

        const paymentId = req.body?.data?.id;

        if (!paymentId) {
            console.log("Pagamento não informado.");
            return res.sendStatus(200);
        }

        // ===================================================
        // FUTURAMENTE:
        // Consultaremos o pagamento diretamente na API
        // do Mercado Pago.
        // ===================================================
        //
        // const payment = await mercadoPagoService.getPayment(paymentId);
        //
        // if(payment.status !== "approved"){
        //     return res.sendStatus(200);
        // }
        //
        // const donation =
        //      await Donation.findByPaymentId(paymentId);
        //
        // await Donation.updateStatus(
        //      donation.id,
        //      "approved",
        //      paymentId
        // );

        // ===================================================
        // TESTE DO OVERLAY
        // ===================================================

        socket.getIO().emit("donation", {

            donor_name: "XS Donate",

            donor_message: "Teste de alerta recebido com sucesso!",

            amount: 10.00

        });

        console.log("Alerta enviado para o OBS.");

        return res.sendStatus(200);

    } catch (error) {

        console.error("Erro no webhook:", error);

        return res.sendStatus(500);

    }

});

module.exports = router;