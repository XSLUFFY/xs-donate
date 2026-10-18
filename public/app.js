const socket = io();

const alertBox = document.getElementById("alert");
const gif = document.getElementById("gif");
const nameText = document.getElementById("name");
const messageText = document.getElementById("message");
const amountText = document.getElementById("amount");

const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");

const queue = [];
let showing = false;
let audioContext = null;

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

function playAlertSound() {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            console.warn("Este navegador não suporta Web Audio.");
            return;
        }

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        const playChime = () => {
            const notes = [880, 1174.66, 1567.98];
            const startTime = audioContext.currentTime + 0.02;

            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();

                const noteStart = startTime + index * 0.14;
                const noteEnd = noteStart + 0.22;

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(
                    frequency,
                    noteStart
                );

                gain.gain.setValueAtTime(0.0001, noteStart);
                gain.gain.exponentialRampToValueAtTime(
                    0.18,
                    noteStart + 0.025
                );
                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    noteEnd
                );

                oscillator.connect(gain);
                gain.connect(audioContext.destination);

                oscillator.start(noteStart);
                oscillator.stop(noteEnd + 0.03);
            });
        };

        if (audioContext.state === "suspended") {
            audioContext.resume()
                .then(playChime)
                .catch((error) => {
                    console.warn(
                        "O navegador bloqueou o áudio:",
                        error.message
                    );
                });
        } else {
            playChime();
        }
    } catch (error) {
        console.warn("Não foi possível reproduzir o som:", error);
    }
}

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

    gif.onerror = () => {
        gif.onerror = null;
        gif.src = "/gifs/default.gif";
    };

    gif.src = donation.gif || "/gifs/default.gif";

    alertBox.classList.remove("hidden", "fadeOut");

    playAlertSound();

    const requestedDuration = Number(donation.duration);
    const duration =
        Number.isFinite(requestedDuration) && requestedDuration > 0
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
