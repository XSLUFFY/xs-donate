const express = require("express");

const router = express.Router();

const Donation = require("../models/Donation");

const mercadoPagoService =
    require("../services/mercadoPagoService");

const socket =
    require("../socket");


// ==========================================
// WEBHOOK MERCADO PAGO
// ==========================================

router.post("/mercadopago", async (req, res) => {

    try {

        console.log("==================================");
        console.log("🔔 WEBHOOK MERCADO PAGO");
        console.log("==================================");

        console.log("Tipo:", req.body?.type);

        console.log(
            "Ação:",
            req.body?.action
        );

        console.log(
            "Payment ID:",
            req.body?.data?.id
        );

        console.log("==================================");


        // ======================================
        // PEGAR PAYMENT ID
        // ======================================

        const paymentId =
            req.body?.data?.id ||
            req.query?.["data.id"];


        if (!paymentId) {

            console.log(
                "⚠️ Payment ID não informado."
            );

            return res.sendStatus(200);

        }


        // ======================================
        // IGNORAR EVENTOS QUE NÃO SÃO PAYMENT
        // ======================================

        const type =
            req.body?.type ||
            req.query?.type;


        if (
            type &&
            type !== "payment"
        ) {

            console.log(
                "ℹ️ Evento ignorado:",
                type
            );

            return res.sendStatus(200);

        }


        // ======================================
        // CONSULTAR PAGAMENTO NO MERCADO PAGO
        // ======================================

        const payment =
            await mercadoPagoService.getPayment(
                paymentId
            );


        console.log("==================================");
        console.log("💳 PAGAMENTO CONSULTADO");
        console.log("==================================");

        console.log(
            "ID:",
            payment.id
        );

        console.log(
            "Status:",
            payment.status
        );

        console.log(
            "Status detail:",
            payment.status_detail
        );

        console.log(
            "External reference:",
            payment.external_reference
        );

        console.log("==================================");


        // ======================================
        // SE NÃO ESTIVER APROVADO
        // ======================================

        if (
            payment.status !== "approved"
        ) {

            console.log(
                "⏳ Pagamento ainda não aprovado:",
                payment.status
            );

            return res.sendStatus(200);

        }


        // ======================================
        // LOCALIZAR DOAÇÃO
        // ======================================

        let donation = null;


        // Primeiro tentamos pelo payment_id
        donation =
            await Donation.findByPaymentId(
                payment.id
            );


        // Se ainda não encontrou,
        // usamos external_reference
        if (
            !donation &&
            payment.external_reference
        ) {

            const donationId =
                Number(
                    payment.external_reference
                );


            if (
                Number.isInteger(
                    donationId
                )
            ) {

                const result =
                    await dbFindDonationById(
                        donationId
                    );

                donation = result;

            }

        }


        if (!donation) {

            console.error(
                "❌ Doação não encontrada para o pagamento:",
                payment.id
            );

            return res.sendStatus(200);

        }


        // ======================================
        // EVITAR ALERTA DUPLICADO
        // ======================================

        if (
            donation.status === "approved"
        ) {

            console.log(
                "ℹ️ Doação já estava aprovada."
            );

            return res.sendStatus(200);

        }


        // ======================================
        // ATUALIZAR DOAÇÃO
        // ======================================

        const updatedDonation =
            await Donation.updateStatus(

                donation.id,

                "approved",

                payment.id

            );


        console.log(
            "✅ Doação atualizada para APPROVED."
        );


        // ======================================
        // ENVIAR ALERTA PARA O OVERLAY
        // ======================================

        socket.emitToUser(

            updatedDonation.user_id,

            "donation",

            {

                id:
                    updatedDonation.id,

                donor_name:
                    updatedDonation.donor_name,

                donor_message:
                    updatedDonation.donor_message ||
                    "Obrigado pela sua doação!",

                amount:
                    Number(
                        updatedDonation.amount
                    ),

                status:
                    "approved",

                gif:
                    "/gifs/default.gif",

                duration:
                    7000

            }

        );


        console.log(
            "🎉 ALERTA REAL ENVIADO PARA O OVERLAY."
        );


        return res.sendStatus(200);


    } catch (error) {

        console.error(
            "❌ Erro no webhook Mercado Pago:",
            error
        );

        return res.sendStatus(500);

    }

});


// ==========================================
// BUSCAR DOAÇÃO PELO ID
// ==========================================
//
// Função auxiliar para o caso em que o
// external_reference contém o ID da doação.
//

async function dbFindDonationById(id) {

    const db = require("../database/db");

    const result = await db.query(

        `
        SELECT *
        FROM donations

        WHERE id = $1

        LIMIT 1
        `,

        [id]

    );

    return result.rows[0];

}


// ==========================================
// EXPORT
// ==========================================

module.exports = router;
