const Donation = require("../models/Donation");

async function createDonation(userId, data) {
    const { donor_name, donor_message, amount } = data;

    if (!donor_name || !amount) {
        throw new Error("Nome do doador e valor são obrigatórios.");
    }

    if (Number(amount) <= 0) {
        throw new Error("O valor da doação deve ser maior que zero.");
    }

    return await Donation.createDonation(
        userId,
        donor_name,
        donor_message || "",
        amount
    );
}

async function getDonations(userId) {
    return await Donation.getDonations(userId);
}

async function updateStatus(id, status, paymentId) {
    return await Donation.updateStatus(id, status, paymentId);
}

module.exports = {
    createDonation,
    getDonations,
    updateStatus
};