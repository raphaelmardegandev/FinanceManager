
const token = localStorage.getItem("financeManagerToken");
const userData = localStorage.getItem("financeManagerUser");

if (!token || !userData) {
    window.location.replace("/login.html");
}

let reportTransactions = [];

document.addEventListener("DOMContentLoaded", async () => {
    if (!token || !userData) return;

    renderLoggedUser();
    configureReportDates();
    configureReportEvents();

    await loadReportFilters();
    await loadReport();
});

function renderLoggedUser() {
    const user = JSON.parse(userData);

    document.getElementById("userName").textContent = user.name;
    document.getElementById("userEmail").textContent = user.email;

    document.getElementById("userAvatar").textContent =
        user.name?.charAt(0).toUpperCase() || "U";
}

function configureReportDates() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(year, today.getMonth() + 1, 0)
        .getDate();

    document.getElementById("reportStartDate").value =
        `${year}-${month}-01`;

    document.getElementById("reportEndDate").value =
        `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
}

function configureReportEvents() {
    document.getElementById("reportFilters")
        .addEventListener("submit", async event => {
            event.preventDefault();
            await loadReport();
        });

    document.getElementById("clearReportFilters")
        .addEventListener("click", async () => {
            document.getElementById("reportFilters").reset();

            document.getElementById("reportStartDate").value = "";
            document.getElementById("reportEndDate").value = "";

            await loadReport();
        });

    document.getElementById("exportReportCsv")
        .addEventListener("click", exportReportCsv);

    document.getElementById("exportReportPdf")
        .addEventListener("click", exportReportPdf);
}

async function loadReportFilters() {
    try {
        const [accountsResponse, categoriesResponse] =
            await Promise.all([
                fetch("/api/accounts", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch("/api/categories", {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

        if (accountsResponse.status === 401 ||
            categoriesResponse.status === 401) {
            logout();
            return;
        }

        if (!accountsResponse.ok || !categoriesResponse.ok) {
            throw new Error("Erro ao carregar filtros.");
        }

        const accounts = await accountsResponse.json();
        const categories = await categoriesResponse.json();

        fillSelect("reportAccount", accounts, "Todas as contas");
        fillSelect("reportCategory", categories, "Todas as categorias");

    } catch (error) {
        console.error(error);
    }
}

function fillSelect(elementId, items, defaultText) {
    const select = document.getElementById(elementId);

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultText;

    select.appendChild(defaultOption);

    items.forEach(item => {
        const option = document.createElement("option");

        option.value = item.id;
        option.textContent = item.name;

        select.appendChild(option);
    });
}

async function loadReport() {
    const params = new URLSearchParams();

    const startDate = document.getElementById("reportStartDate").value;
    const endDate = document.getElementById("reportEndDate").value;
    const type = document.getElementById("reportType").value;
    const accountId = document.getElementById("reportAccount").value;
    const categoryId = document.getElementById("reportCategory").value;

    if (startDate && endDate && startDate > endDate) {
        alert("A data inicial não pode ser maior que a data final.");
        return;
    }

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (type) params.append("type", type);
    if (accountId) params.append("accountId", accountId);
    if (categoryId) params.append("categoryId", categoryId);

    const table = document.getElementById("reportTransactionsTable");

    table.innerHTML = `
        <tr>
            <td colspan="6" class="loading">Carregando relatório...</td>
        </tr>
    `;

    document.getElementById("exportReportCsv").disabled = true;

    try {
        const response = await fetch(`/api/reports?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao consultar relatório.");
        }

        const report = await response.json();

        reportTransactions = report.transactions;

        renderReportSummary(report);
        renderReportTransactions(report.transactions);

        document.getElementById("exportReportCsv").disabled =
            report.transactions.length === 0;

    } catch (error) {
        console.error(error);

        reportTransactions = [];

        table.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    Não foi possível carregar o relatório.
                </td>
            </tr>
        `;
    }
}

function renderReportSummary(report) {
    document.getElementById("reportTotalIncome").textContent =
        formatCurrency(report.totalIncome);

    document.getElementById("reportTotalExpense").textContent =
        formatCurrency(report.totalExpense);

    const balanceElement = document.getElementById("reportBalance");

    balanceElement.textContent = formatCurrency(report.balance);
    balanceElement.classList.remove("income", "expense");

    if (report.balance > 0) {
        balanceElement.classList.add("income");
    } else if (report.balance < 0) {
        balanceElement.classList.add("expense");
    }

    document.getElementById("reportTransactionCount").textContent =
        report.transactionCount;
}

function renderReportTransactions(items) {
    const table = document.getElementById("reportTransactionsTable");

    table.replaceChildren();

    if (items.length === 0) {
        const row = table.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 6;
        cell.className = "loading";
        cell.textContent = "Nenhuma transação encontrada.";

        return;
    }

    items.forEach(transaction => {
        const row = table.insertRow();

        const values = [
            formatDate(transaction.date),
            transaction.description,
            transaction.account,
            transaction.category,
            transaction.type === 1 ? "Receita" : "Despesa"
        ];

        values.forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });

        const amountCell = row.insertCell();

        amountCell.className =
            transaction.type === 1
                ? "transaction-income"
                : "transaction-expense";

        amountCell.textContent =
            `${transaction.type === 1 ? "+" : "-"} ${formatCurrency(transaction.amount)}`;
    });
}

function exportReportCsv() {
    if (reportTransactions.length === 0) return;

    const rows = [
        ["Data", "Descrição", "Conta", "Categoria", "Tipo", "Valor", "Observações"]
    ];

    reportTransactions.forEach(transaction => {
        rows.push([
            formatDate(transaction.date),
            transaction.description,
            transaction.account,
            transaction.category,
            transaction.type === 1 ? "Receita" : "Despesa",
            transaction.amount.toFixed(2).replace(".", ","),
            transaction.notes || ""
        ]);
    });

    const csv = rows
        .map(row => row.map(escapeCsvValue).join(";"))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF", csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "finance-manager-relatorio.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
    const text = String(value ?? "");

    const safeText = /^[\s]*[=+\-@\t\r]/.test(text)
        ? `'${text}`
        : text;

    return `"${safeText.replace(/"/g, '""')}"`;
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

async function exportReportPdf() {
    const button = document.getElementById("exportReportPdf");

    const params = new URLSearchParams();

    const startDate = document.getElementById("reportStartDate").value;
    const endDate = document.getElementById("reportEndDate").value;
    const type = document.getElementById("reportType").value;
    const accountId = document.getElementById("reportAccount").value;
    const categoryId = document.getElementById("reportCategory").value;

    if (startDate && endDate && startDate > endDate) {
        alert("A data inicial não pode ser maior que a data final.");
        return;
    }

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (type) params.append("type", type);
    if (accountId) params.append("accountId", accountId);
    if (categoryId) params.append("categoryId", categoryId);

    button.disabled = true;
    button.textContent = "Gerando PDF...";

    try {
        const response = await fetch(
            `/api/reports/pdf?${params.toString()}`,
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
            throw new Error("Erro ao gerar PDF.");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "finance-manager-relatorio.pdf";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

    } catch (error) {
        console.error(error);
        alert("Não foi possível gerar o relatório em PDF.");

    } finally {
        button.disabled = false;
        button.textContent = "Exportar PDF";
    }
}

function logout() {
    localStorage.removeItem("financeManagerToken");
    localStorage.removeItem("financeManagerUser");

    window.location.href = "/login.html";
}
