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

// Inicializa o Socket.IO
socket.initialize(server);

app.use(cors());
app.use(helmet());
app.use(express.json());

// ===========================
// ARQUIVOS PÚBLICOS
// ===========================

app.use(express.static(path.join(__dirname, "public")));

// ===========================
// ROTAS DA API
// ===========================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/test", testRoutes);

// ===========================
// WEBHOOK MERCADO PAGO
// ===========================

app.use("/webhook", webhookRoutes);

// ===========================
// OVERLAY OBS
// ===========================

app.get("/overlay", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "overlay.html"));
});

// ===========================
// ROTA PRINCIPAL
// ===========================

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

        // Cria as tabelas automaticamente
        await User.createTable();
        await Profile.createTable();
        await Donation.createTable();

        server.listen(PORT, () => {
            console.log("==================================");
            console.log("         XS DONATE BACKEND");
            console.log("==================================");
            console.log(`🚀 Servidor: http://localhost:${PORT}`);
            console.log(`📡 API: http://localhost:${PORT}/api`);
            console.log(`📺 Overlay OBS: http://localhost:${PORT}/overlay`);
            console.log(`🧪 Teste de Alerta: POST http://localhost:${PORT}/api/test/alert`);
            console.log("⚡ Socket.IO: Ativo");
            console.log("💳 Mercado Pago: Ativado");
            console.log("🔔 Webhook: /webhook/mercadopago");
            console.log("==================================");
        });

    } catch (error) {
        console.error("Erro ao iniciar o servidor:", error);
    }
}

startServer();