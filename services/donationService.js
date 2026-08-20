const Donation = require("../models/Donation");
const socket = require("../socket");

async function createDonation(userId, data) {
    const { donor_name, donor_message, amount, gif, duration } = data;

    if (!donor_name || !amount) {
        throw new Error("Nome do doador e valor são obrigatórios.");
    }

    if (Number(amount) <= 0) {
        throw new Error("O valor da doação deve ser maior que zero.");
    }

    const donation = await Donation.createDonation(
        userId,
        donor_name,
        donor_message || "",
        amount
    );

    // Envia a doação para o overlay em tempo real
    socket.emitToUser(userId, "donation", {
        id: donation.id,
        donor_name: donation.donor_name,
        donor_message: donation.donor_message,
        amount: donation.amount,
        status: donation.status,
        gif: gif || "/gifs/default.gif",
        duration: Number(duration) || 7000
    });

    return donation;
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
