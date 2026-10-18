const express = require("express");
const router = express.Router();

const authModule = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

const auth =
    typeof authModule === "function"
        ? authModule
        : authModule?.authMiddleware ||
          authModule?.auth ||
          authModule?.authenticate;

const createPix =
    typeof paymentController?.createPix === "function"
        ? paymentController.createPix
        : null;

console.log(
    "[payments] auth:",
    typeof auth,
    "| createPix:",
    typeof createPix
);

if (typeof auth !== "function") {
    throw new TypeError(
        "authMiddleware não exporta uma função válida."
    );
}

if (typeof createPix !== "function") {
    throw new TypeError(
        "paymentController não exporta createPix como função."
    );
}

router.post("/pix", auth, createPix);

module.exports = router;
