const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const donationController = require("../controllers/donationController");

router.post("/", auth, donationController.createDonation);

router.get("/", auth, donationController.getDonations);

module.exports = router;