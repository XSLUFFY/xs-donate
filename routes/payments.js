const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

router.post("/pix", auth, paymentController.createPix);

module.exports = router;