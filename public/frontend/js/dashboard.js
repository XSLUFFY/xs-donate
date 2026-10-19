
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        user = null;
    }

    if (!token) {
        window.location.replace("login.html");
        return;
    }

    const GOAL = 10000;
    let allDonations = [];

    const money = (value) =>
        Number(value || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    const approved = (donation) =>
        String(donation.status || "").toLowerCase() === "approved";

    const donationDate = (donation) => {
        const date = new Date(donation.created_at);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const sameDay = (first, second) =>
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate();

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function showTableMessage(id, columns, message) {
        const tbody = document.getElementById(id);
        if (!tbody) return;

        tbody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = columns;
        cell.textContent = message;

        row.appendChild(cell);
        tbody.appendChild(row);
    }

    function addCell(row, value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
    }

    function renderDonations(donations) {
        const tbody = document.getElementById("donationsTable");
        if (!tbody) return;

        tbody.replaceChildren();

        if (donations.length === 0) {
            showTableMessage("donationsTable", 4, "Nenhuma doação registrada.");
            return;
        }

        donations.slice(0, 10).forEach((donation) => {
            const row = document.createElement("tr");

            addCell(row, donation.donor_name || "Anônimo");
            addCell(row, donation.donor_message || "Sem mensagem");
            addCell(row, money(donation.amount));

            const status = String(donation.status || "pending").toLowerCase();
            const labels = {
                approved: "Aprovada",
                pending: "Pendente",
                rejected: "Recusada",
                cancelled: "Cancelada",
                refunded: "Estornada"
            };

            addCell(row, labels[status] || status);
            tbody.appendChild(row);
        });
    }

    function renderSupporters(donations) {
        const tbody = document.getElementById("supportersTable");
        if (!tbody) return;

        const totals = new Map();

        donations.filter(approved).forEach((donation) => {
            const name = String(donation.donor_name || "Anônimo").trim();
            totals.set(name, (totals.get(name) || 0) + Number(donation.amount || 0));
        });

        const ranked = [...totals.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        tbody.replaceChildren();

        if (ranked.length === 0) {
            showTableMessage("supportersTable", 3, "Ainda não há apoiadores com doações aprovadas.");
            return;
        }

        ranked.forEach(([name, total], index) => {
            const row = document.createElement("tr");
            addCell(row, ["🥇", "🥈", "🥉", "4º", "5º"][index]);
            addCell(row, name);
            addCell(row, money(total));
            tbody.appendChild(row);
        });
    }

    function renderChart(donations) {
        const canvas = document.getElementById("donationChart");
        if (!canvas) return;

        const container = canvas.parentElement;
        const width = Math.max(container.clientWidth || 600, 300);
        const height = 260;
        const ratio = window.devicePixelRatio || 1;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = "100%";
        canvas.style.height = `${height}px`;

        const context = canvas.getContext("2d");
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);

        const days = [];

        for (let offset = 6; offset >= 0; offset--) {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - offset);

            const total = donations
                .filter(approved)
                .filter((donation) => {
                    const date = donationDate(donation);
                    return date && sameDay(date, day);
                })
                .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);

            days.push({
                label: day.toLocaleDateString("pt-BR", { weekday: "short" }),
                total
            });
        }

        const padding = { left: 48, right: 16, top: 16, bottom: 34 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;
        const maxValue = Math.max(...days.map((day) => day.total), 1);

        context.font = "12px sans-serif";
        context.strokeStyle = "#25324A";
        context.fillStyle = "#CCCCCC";
        context.lineWidth = 1;

        for (let line = 0; line <= 4; line++) {
            const y = padding.top + graphHeight * line / 4;

            context.beginPath();
            context.moveTo(padding.left, y);
            context.lineTo(width - padding.right, y);
            context.stroke();

            const value = maxValue * (4 - line) / 4;
            context.fillText(value.toFixed(0), 4, y + 4);
        }

        const points = days.map((day, index) => ({
            x: padding.left + graphWidth * index / 6,
            y: padding.top + graphHeight * (1 - day.total / maxValue),
            label: day.label
        }));

        context.strokeStyle = "#00E5FF";
        context.lineWidth = 3;
        context.beginPath();

        points.forEach((point, index) => {
            if (index === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        });

        context.stroke();

        points.forEach((point) => {
            context.fillStyle = "#00E5FF";
            context.beginPath();
            context.arc(point.x, point.y, 4, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = "#CCCCCC";
            context.textAlign = "center";
            context.fillText(point.label, point.x, height - 10);
        });

        context.textAlign = "start";
    }

    function updateDashboard(donations) {
        const paid = donations.filter(approved);
        const now = new Date();

        const today = paid.filter((donation) => {
            const date = donationDate(donation);
            return date && sameDay(date, now);
        });

        const month = paid.filter((donation) => {
            const date = donationDate(donation);
            return date &&
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth();
        });

        const totalApproved = paid.reduce(
            (sum, donation) => sum + Number(donation.amount || 0), 0
        );

        const todayTotal = today.reduce(
            (sum, donation) => sum + Number(donation.amount || 0), 0
        );

        const monthTotal = month.reduce(
            (sum, donation) => sum + Number(donation.amount || 0), 0
        );

        setText("totalApproved", money(totalApproved));
        setText("todayTotal", money(todayTotal));
        setText("monthTotal", money(monthTotal));
        setText("approvedCount", String(paid.length));
        setText("todayCount", `${today.length} doações aprovadas`);
        setText("monthCount", `${month.length} doações aprovadas`);

        const percentage = Math.min((monthTotal / GOAL) * 100, 100);
        const progress = document.getElementById("goalProgress");

        if (progress) progress.style.width = `${percentage}%`;

        setText("goalText", `${money(monthTotal)} / ${money(GOAL)} (${percentage.toFixed(1)}%)`);

        renderDonations([...donations].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        }));

        renderSupporters(donations);
        renderChart(donations);
    }

    const name = user && user.name ? user.name : "Streamer";
    setText("userName", name);
    setText("welcomeTitle", `Bem-vindo, ${name} 👋`);
    setText("userAvatar", name.trim().charAt(0).toUpperCase() || "X");

    document.getElementById("logoutButton")?.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("login.html");
    });

    document.getElementById("openOverlayButton")?.addEventListener("click", () => {
        if (!user || !user.id) {
            alert("Não foi possível identificar seu usuário. Faça login novamente.");
            return;
        }

        const url = `/overlay?userId=${encodeURIComponent(user.id)}`;
        window.open(url, "_blank", "noopener");
    });

    async function loadDonations() {
        try {
            const response = await fetch("/api/donations", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                alert("Sua sessão expirou. Entre novamente.");
                window.location.replace("login.html");
                return;
            }

            const data = await response.json();

            if (!response.ok || !data.success || !Array.isArray(data.donations)) {
                throw new Error(data.message || "Não foi possível carregar as doações.");
            }

            allDonations = data.donations;
            updateDashboard(allDonations);

        } catch (error) {
            console.error("XS Donate: erro ao carregar doações:", error);
            showTableMessage("donationsTable", 4, "Não foi possível carregar o histórico. Atualize a página ou entre novamente.");
            showTableMessage("supportersTable", 3, "Dados indisponíveis.");
            alert("Não foi possível carregar as doações. Confira sua conexão e tente novamente.");
        }
    }

    window.addEventListener("resize", () => renderChart(allDonations));

    loadDonations();
});
