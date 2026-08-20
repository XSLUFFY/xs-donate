const socket = io();

const alertBox = document.getElementById("alert");
const alertSound = document.getElementById("alertSound");

const gif = document.getElementById("gif");
const nameText = document.getElementById("name");
const messageText = document.getElementById("message");
const amountText = document.getElementById("amount");

const queue = [];
let showing = false;

// Recebe uma nova doação
socket.on("donation", (data) => {

    queue.push(data);

    if (!showing) {
        showNextAlert();
    }

});

function showNextAlert() {

    if (queue.length === 0) {

        showing = false;

        return;

    }

    showing = true;

    const donation = queue.shift();

    // Preenche os dados
    nameText.textContent =
        donation.donor_name || "Anônimo";

    messageText.textContent =
        donation.donor_message || "Obrigado pela doação!";

    amountText.textContent =
        "R$ " + Number(donation.amount || 0).toFixed(2);

    // GIF personalizado
    if (donation.gif) {

        gif.src = donation.gif;

    } else {

        gif.src = "/gifs/default.gif";

    }

    // Reinicia o áudio
    if (alertSound) {

        alertSound.pause();
        alertSound.currentTime = 0;

        alertSound.play().catch(() => {});

    }

    // Remove estados antigos
    alertBox.classList.remove("hidden");
    alertBox.classList.remove("fadeOut");

    // Tempo do alerta
    const duration = donation.duration || 7000;

    setTimeout(() => {

        alertBox.classList.add("fadeOut");

        setTimeout(() => {

            alertBox.classList.add("hidden");
            alertBox.classList.remove("fadeOut");

            showNextAlert();

        }, 500);

    }, duration);

}