const socket = io();

// ===========================
// CONFIGURAÇÕES
// ===========================

let totalRaised = 0;
let totalDonations = 0;
let highestDonation = 0;

const MONTHLY_GOAL = 500;

// ===========================
// ELEMENTOS
// ===========================

const totalRaisedElement =
    document.getElementById("totalRaised");

const totalDonationsElement =
    document.getElementById("totalDonations");

const highestDonationElement =
    document.getElementById("highestDonation");

const lastDonationElement =
    document.getElementById("lastDonation");

const donationTable =
    document.getElementById("donationTable");

const goalText =
    document.getElementById("goalText");

const goalBar =
    document.getElementById("goalBar");

const goalRemaining =
    document.getElementById("goalRemaining");

// ===========================
// FORMATAÇÃO DE MOEDA
// ===========================

function formatCurrency(value) {

    return Number(value || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}

// ===========================
// ATUALIZAR DASHBOARD
// ===========================

function updateDashboard() {

    totalRaisedElement.textContent =
        formatCurrency(totalRaised);

    totalDonationsElement.textContent =
        totalDonations;

    highestDonationElement.textContent =
        formatCurrency(highestDonation);

    updateGoal();

}

// ===========================
// ATUALIZAR META
// ===========================

function updateGoal() {

    const percentage =
        Math.min(
            (totalRaised / MONTHLY_GOAL) * 100,
            100
        );

    goalBar.style.width =
        percentage + "%";

    goalText.textContent =
        `${formatCurrency(totalRaised)} / ${formatCurrency(MONTHLY_GOAL)}`;

    const remaining =
        Math.max(
            MONTHLY_GOAL - totalRaised,
            0
        );

    goalRemaining.textContent =
        formatCurrency(remaining);

}

// ===========================
// ADICIONAR DOAÇÃO NA TABELA
// ===========================

function addDonationToTable(donation) {

    const emptyRow =
        donationTable.querySelector("td[colspan='3']");

    if (emptyRow) {
        donationTable.innerHTML = "";
    }

    const row =
        document.createElement("tr");

    const nameCell =
        document.createElement("td");

    const amountCell =
        document.createElement("td");

    const messageCell =
        document.createElement("td");

    nameCell.textContent =
        donation.donor_name || "Anônimo";

    amountCell.textContent =
        formatCurrency(donation.amount);

    messageCell.textContent =
        donation.donor_message || "Sem mensagem";

    row.appendChild(nameCell);
    row.appendChild(amountCell);
    row.appendChild(messageCell);

    donationTable.prepend(row);

}

// ===========================
// SOCKET.IO
// ===========================

socket.on("connect", () => {

    console.log(
        "🟢 Dashboard conectado ao XS Donate"
    );

});

socket.on("disconnect", () => {

    console.log(
        "🔴 Dashboard desconectado"
    );

});

// ===========================
// NOVA DOAÇÃO
// ===========================

socket.on("donation", (donation) => {

    console.log(
        "💰 Nova doação:",
        donation
    );

    const amount =
        Number(donation.amount || 0);

    totalRaised += amount;

    totalDonations++;

    if (amount > highestDonation) {

        highestDonation =
            amount;

    }

    lastDonationElement.textContent =
        `${donation.donor_name || "Anônimo"} - ${formatCurrency(amount)}`;

    addDonationToTable(donation);

    updateDashboard();

});

// ===========================
// INICIALIZAÇÃO
// ===========================

updateDashboard();

console.log(
    "🚀 XS Donate Dashboard iniciado"
);