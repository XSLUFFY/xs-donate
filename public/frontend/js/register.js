
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const button = document.getElementById("registerButton");

    if (!form || !button) {
        console.error("Formulário de cadastro ou botão não encontrado.");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (!name) {
            alert("Digite seu nome.");
            return;
        }

        if (password !== confirmPassword) {
            alert("As senhas não coincidem.");
            return;
        }

        if (password.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        button.disabled = true;
        button.textContent = "Criando conta...";

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Não foi possível criar a conta.");
                return;
            }

            alert("Conta criada com sucesso! Agora faça seu login.");
            window.location.href = "login.html";

        } catch (error) {
            console.error("Erro no cadastro:", error);
            alert("Não foi possível conectar ao servidor. Tente novamente.");
        } finally {
            button.disabled = false;
            button.textContent = "Criar Conta";
        }
    });
});
