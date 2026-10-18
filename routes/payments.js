const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

router.post("/pix", auth, paymentController.createPix);

router.get(
    "/orders/by-donation/:donationId",
    auth,
    paymentController.getPixOrder
);

module.exports = router;
