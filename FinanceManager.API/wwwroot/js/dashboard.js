const token = localStorage.getItem("financeManagerToken");
const userData = localStorage.getItem("financeManagerUser");

if (!token || !userData) {
    window.location.href = "/login.html";
}

const loggedUser = JSON.parse(userData);

let evolutionChart = null;
let categoryChart = null;

document.addEventListener("DOMContentLoaded", async () => {
    renderLoggedUser();
    configurePeriodFilter();
    await loadDashboard();

    document
        .getElementById("dashboardMonth")
        .addEventListener("change", loadDashboard);

    document
        .getElementById("dashboardYear")
        .addEventListener("change", loadDashboard);
});

function configurePeriodFilter() {
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const monthSelect =
        document.getElementById("dashboardMonth");

    const yearSelect =
        document.getElementById("dashboardYear");

    monthSelect.value = currentMonth;

    for (
        let year = currentYear;
        year >= currentYear - 5;
        year--
    ) {
        const option = document.createElement("option");

        option.value = year;
        option.textContent = year;

        yearSelect.appendChild(option);
    }

    yearSelect.value = currentYear;
}

function renderLoggedUser() {
    document.getElementById("userName").textContent =
        loggedUser.name;

    document.getElementById("userEmail").textContent =
        loggedUser.email;

    const firstLetter = loggedUser.name
        ? loggedUser.name.charAt(0).toUpperCase()
        : "U";

    document.getElementById("userAvatar").textContent =
        firstLetter;
}

async function loadDashboard() {
    try {
        const month = document.getElementById("dashboardMonth").value;
        const year = document.getElementById("dashboardYear").value;

        const response = await fetch(
            `/api/dashboard?year=${year}&month=${month}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao carregar dashboard.");
        }

        const dashboard = await response.json();

        renderSummary(dashboard);
        renderEvolutionChart(dashboard.monthlyEvolution);
        renderCategoryChart(dashboard.expensesByCategory);
        renderRecentTransactions(dashboard.recentTransactions);

    } catch (error) {
        console.error(error);

        document.getElementById(
            "recentTransactionsTable"
        ).innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    Não foi possível carregar o dashboard.
                </td>
            </tr>
        `;
    }
}

function renderSummary(dashboard) {
    document.getElementById("totalBalance").textContent =
        formatCurrency(dashboard.totalBalance);

    document.getElementById("monthlyIncome").textContent =
        formatCurrency(dashboard.monthlyIncome);

    document.getElementById("monthlyExpense").textContent =
        formatCurrency(dashboard.monthlyExpense);

    document.getElementById("monthlyBalance").textContent =
        formatCurrency(dashboard.monthlyBalance);

    const monthlyBalanceElement =
    document.getElementById("monthlyBalance");

    monthlyBalanceElement.classList.remove(
        "income",
        "expense"
    );

    if (dashboard.monthlyBalance > 0) {
        monthlyBalanceElement.classList.add("income");
    } else if (dashboard.monthlyBalance < 0) {
        monthlyBalanceElement.classList.add("expense");
    }
}

function renderEvolutionChart(items) {
    const canvas = document.getElementById("evolutionChart");

    if (evolutionChart) 
    {
        evolutionChart.destroy();
    }

    evolutionChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels: items.map(item =>
                formatMonth(item.month)
            ),

            datasets: [
                {
                    label: "Receitas",
                    data: items.map(item => item.income),
                    backgroundColor: "#16803c",
                    borderRadius: 5
                },
                {
                    label: "Despesas",
                    data: items.map(item => item.expense),
                    backgroundColor: "#c0392b",
                    borderRadius: 5
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: {
                    position: "top"
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            `${context.dataset.label}: ${formatCurrency(context.raw)}`
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: value =>
                            formatCurrency(value)
                    }
                }
            }
        }
    });
}

function renderCategoryChart(items) {
    const canvas = document.getElementById("categoryChart");

    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }

    const container = canvas.parentElement;

    const oldMessage =
        container.querySelector(".chart-empty");

    if (oldMessage) {
        oldMessage.remove();
    }

    canvas.style.display = "block";

    if (items.length === 0) {
        canvas.style.display = "none";

        const message = document.createElement("div");

        message.className = "chart-empty";
        message.textContent =
            "Nenhuma despesa encontrada no período.";

        container.appendChild(message);

        return;
    }

    categoryChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: items.map(item => item.category),

            datasets: [
                {
                    data: items.map(item => item.amount),

                    backgroundColor: [
                        "#6d5dfc",
                        "#16803c",
                        "#c0392b",
                        "#2563eb",
                        "#d97706",
                        "#7c3aed",
                        "#0891b2"
                    ],

                    borderWidth: 2,
                    borderColor: "#ffffff"
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "70%",

            plugins: {
                legend: {
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            `${context.label}: ${formatCurrency(context.raw)}`
                    }
                }
            }
        }
    });
}

function renderRecentTransactions(items) {
    const table = document.getElementById(
        "recentTransactionsTable"
    );

    if (items.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    Nenhuma transação encontrada.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = items.map(transaction => `
        <tr>

            <td>
                ${transaction.description}
            </td>

            <td>
                ${transaction.category}
            </td>

            <td>
                ${transaction.account}
            </td>

            <td>
                ${formatDate(transaction.date)}
            </td>

            <td class="${
                transaction.type === 1
                    ? "transaction-income"
                    : "transaction-expense"
            }">

                ${
                    transaction.type === 1
                        ? "+"
                        : "-"
                }

                ${formatCurrency(transaction.amount)}

            </td>

        </tr>
    `).join("");
}

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatDate(value) {
    return new Date(value).toLocaleDateString("pt-BR", {
        timeZone: "UTC"
    });
}

function formatMonth(value) {
    return value
        .replace(".", "")
        .replace(/^./, letter => letter.toUpperCase());
}

function logout() {
    localStorage.removeItem("financeManagerToken");
    localStorage.removeItem("financeManagerUser");

    window.location.href = "/login.html";
}