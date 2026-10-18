```javascript
async function startServer() {
    try {
        console.log("Iniciando XS Donate...");

        await User.createTable();
        console.log("Tabela users verificada.");

        await Profile.createTable();
        console.log("Tabela profiles verificada.");

        await Donation.createTable();
        console.log("Tabela donations verificada.");

        server.listen(PORT, () => {
            console.log("XS DONATE BACKEND iniciado.");
            console.log(`Porta: ${PORT}`);
            console.log(`Overlay OBS: /overlay`);
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
```
