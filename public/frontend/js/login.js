
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const button = document.getElementById("loginButton");

    if (!form || !button) {
        console.error("XS Donate: formulário de login não encontrado.");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Informe seu e-mail e sua senha.");
            return;
        }

        button.disabled = true;
        button.textContent = "Entrando...";

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.token) {
                alert(data.message || "Não foi possível entrar.");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("XS Donate - erro no login:", error);
            alert("Erro de conexão com o XS Donate. Tente novamente.");
        } finally {
            button.disabled = false;
            button.textContent = "Entrar";
        }
    });
});
