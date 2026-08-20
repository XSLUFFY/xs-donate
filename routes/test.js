const express = require("express");
const router = express.Router();

const socket = require("../socket");

router.post("/alert", (req, res) => {

    const {
        donor_name,
        donor_message,
        amount
    } = req.body;

    socket.getIO().emit("donation", {

        donor_name: donor_name || "XS Donate",

        donor_message: donor_message || "Este é um alerta de teste!",

        amount: Number(amount || 10)

    });

    return res.json({
        success: true,
        message: "Alerta enviado com sucesso!"
    });

});

module.exports = router;