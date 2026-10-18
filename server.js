require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const socket = require("./socket");

const User = require("./models/User");
const Profile = require("./models/Profile");
const Donation = require("./models/Donation");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const donationRoutes = require("./routes/donations");
const paymentRoutes = require("./routes/payments");
const webhookRoutes = require("./webhooks/mercadoPagoWebhook");
const testRoutes = require("./routes/test");

const app = express();
const server = http.createServer(app);

socket.initialize(server);

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/test", testRoutes);
app.use("/webhook", webhookRoutes);

app.get("/overlay", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "overlay.html"));
});

app.get("/", (req, res) => {
    res.json({
        application: "XS Donate",
        version: "1.0.0",
        status: "online"
    });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log("Iniciando XS Donate...");

        await User.createTable();
        await Profile.createTable();
        await Donation.createTable();

        server.listen(PORT, () => {
            console.log("XS DONATE BACKEND iniciado.");
            console.log(`Porta: ${PORT}`);
            console.log("Overlay OBS: /overlay");
            console.log("Socket.IO: inicializado.");
            console.log("Webhook: /webhook/mercadopago");
        });
    } catch (error) {
        console.error("FALHA AO INICIAR O XS DONATE:");
        console.error(error);
        process.exit(1);
    }
}

startServer();
