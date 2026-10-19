<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login | XS Donate</title>

    <link rel="stylesheet" href="../css/style.css">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>

<body class="auth-page">

    <div class="auth-card">
        <h1>XS Donate</h1>
        <p>Entre na sua conta</p>

        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email</label>
                <input
                    type="email"
                    id="email"
                    placeholder="Digite seu email"
                    autocomplete="email"
                    required>
            </div>

            <div class="form-group">
                <label for="password">Senha</label>
                <input
                    type="password"
                    id="password"
                    placeholder="Digite sua senha"
                    autocomplete="current-password"
                    required>
            </div>

            <button type="submit" class="auth-button">
                Entrar
            </button>
        </form>

        <div class="auth-links">
            <a href="register.html">
                Ainda não possui conta? Cadastre-se
            </a>
        </div>
    </div>

    <script src="../js/app.js"></script>
    <script src="../js/login.js"></script>

</body>
</html>
