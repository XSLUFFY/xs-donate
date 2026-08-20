const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

router.get("/profile", auth, profileController.getProfile);

router.put("/profile", auth, profileController.updateProfile);

module.exports = router;