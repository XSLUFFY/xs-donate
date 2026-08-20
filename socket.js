const { Server } = require("socket.io");

let io = null;

function initialize(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Cliente conectado: ${socket.id}`);

        socket.on("disconnect", () => {
            console.log(`🔌 Cliente desconectado: ${socket.id}`);
        });

        socket.on("join-user", (userId) => {
            if (!userId) return;

            socket.join(`user-${userId}`);

            console.log(
                `👤 Socket ${socket.id} entrou na sala do usuário ${userId}`
            );
        });
    });

    console.log("⚡ Socket.IO inicializado.");

    return io;
}

function getIO() {
    if (!io) {
        throw new Error("Socket.IO ainda não foi inicializado.");
    }

    return io;
}

function emitToUser(userId, event, data) {
    if (!io || !userId) return;

    io.to(`user-${userId}`).emit(event, data);
}

module.exports = {
    initialize,
    getIO,
    emitToUser
};
