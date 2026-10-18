const socket = io();

const alertBox = document.getElementById("alert");
const alertSound = document.getElementById("alertSound");

const gif = document.getElementById("gif");
const nameText = document.getElementById("name");
const messageText = document.getElementById("message");
const amountText = document.getElementById("amount");

// O ID é recebido pela URL do overlay: /overlay?userId=1
const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");

const queue = [];
let showing = false;

socket.on("connect", () => {
    console.log("XS Donate Overlay conectado:", socket.id);

    if (userId && /^\d+$/.test(userId) && Number(userId) > 0) {
        socket.emit("join-user", userId);
        console.log("Solicitando entrada na sala do usuário:", userId);
    } else {
        console.warn(
            "ID do usuário ausente ou inválido. " +
            "Use /overlay?userId=ID_DO_USUARIO"
        );
    }
});

socket.on("connect_error", (error) => {
    console.error("Erro de conexão do overlay:", error.message);
});

socket.on("donation", (data) => {
    if (!data || typeof data !== "object") {
        return;
    }

    console.log("Alerta de doação recebido:", data);

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

    nameText.textContent = donation.donor_name || "Anônimo";
    messageText.textContent =
        donation.donor_message || "Obrigado pela sua doação!";

    const amount = Number(donation.amount);

    amountText.textContent = Number.isFinite(amount)
        ? amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
        : "R$ 0,00";

    gif.src = donation.gif || "/gifs/default.gif";

    if (alertSound) {
        alertSound.pause();
        alertSound.currentTime = 0;

        const playPromise = alertSound.play();

        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch((error) => {
                console.warn("O navegador bloqueou o áudio:", error.message);
            });
        }
    }

    alertBox.classList.remove("hidden", "fadeOut");

    const requestedDuration = Number(donation.duration);
    const duration = Number.isFinite(requestedDuration) &&
        requestedDuration > 0
            ? requestedDuration
            : 7000;

    setTimeout(() => {
        alertBox.classList.add("fadeOut");

        setTimeout(() => {
            alertBox.classList.add("hidden");
            alertBox.classList.remove("fadeOut");

            showNextAlert();
        }, 500);
    }, duration);
}
