const Donation = require("../models/Donation");

async function createDonation(userId, data) {
    const { donor_name, donor_message, amount } = data || {};

    if (!donor_name || !String(donor_name).trim()) {
        throw new Error("O nome do doador é obrigatório.");
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("O valor da doação deve ser maior que zero.");
    }

    const donation = await Donation.createDonation(
        userId,
        String(donor_name).trim(),
        donor_message || "",
        numericAmount
    );

    return donation;
}

async function getDonations(userId) {
    return Donation.getDonations(userId);
}

async function updateStatus(id, status, paymentId) {
    return Donation.updateStatus(id, status, paymentId);
}

module.exports = {
    createDonation,
    getDonations,
    updateStatus
};
