const token = localStorage.getItem("financeManagerToken");
const userData = localStorage.getItem("financeManagerUser");

if (!token || !userData) {
    window.location.href = "/login.html";
}

const loggedUser = JSON.parse(userData);

let transactions = [];
let accounts = [];
let categories = [];

document.addEventListener("DOMContentLoaded", async () => {
    renderLoggedUser();

    await Promise.all([
        loadAccounts(),
        loadCategories(),
        loadTransactions()
    ]);

    document
        .getElementById("filterType")
        .addEventListener("change", applyFilters);

    document
        .getElementById("filterAccount")
        .addEventListener("change", applyFilters);

    document
        .getElementById("filterCategory")
        .addEventListener("change", applyFilters);

    document
        .getElementById("transactionForm")
        .addEventListener("submit", saveTransaction);

    document
        .getElementById("transactionType")
        .addEventListener("change", loadModalCategories);
});

function renderLoggedUser() {
    document.getElementById("userName").textContent = loggedUser.name;
    document.getElementById("userEmail").textContent = loggedUser.email;

    const firstLetter = loggedUser.name
        ? loggedUser.name.charAt(0).toUpperCase()
        : "U";

    document.getElementById("userAvatar").textContent = firstLetter;
}

async function loadTransactions() {
    try {
        const response = await fetch("/api/transactions", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao carregar transações.");
        }

        transactions = await response.json();

        renderTransactions(transactions);
        updateSummary(transactions);

    } catch (error) {
        console.error(error);

        document.getElementById("transactionsTable").innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    Não foi possível carregar as transações.
                </td>
            </tr>
        `;
    }
}

async function loadAccounts() {
    try {
        const response = await fetch("/api/accounts", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao carregar contas.");
        }

        accounts = await response.json();

        const filterAccount =
            document.getElementById("filterAccount");

        accounts.forEach(account => {
            const option = document.createElement("option");

            option.value = account.id;
            option.textContent = account.name;

            filterAccount.appendChild(option);
        });

    } catch (error) {
        console.error(error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch("/api/categories", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao carregar categorias.");
        }

        categories = await response.json();

        const filterCategory =
            document.getElementById("filterCategory");

        categories.forEach(category => {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            filterCategory.appendChild(option);
        });

    } catch (error) {
        console.error(error);
    }
}

function renderTransactions(items) {
    const table = document.getElementById("transactionsTable");

    if (items.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    Nenhuma transação encontrada.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = items.map(transaction => `
        <tr>
            <td>${transaction.description}</td>

            <td>${transaction.categoryName}</td>

            <td>${transaction.accountName}</td>

            <td>${formatDate(transaction.date)}</td>

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

            <td>
                <span class="account-status ${
                    transaction.active
                        ? "active"
                        : "inactive"
                }">
                    ${
                        transaction.active
                            ? "Ativa"
                            : "Inativa"
                    }
                </span>
            </td>

            <td class="actions-column">
                <div class="table-actions">

                    <button
                        class="action-button edit"
                        onclick="editTransaction(${transaction.id})">
                        Editar
                    </button>

                    ${
                        transaction.active
                            ? `
                                <button
                                    class="action-button danger"
                                    onclick="deactivateTransaction(${transaction.id})">
                                    Excluir
                                </button>
                            `
                            : ""
                    }

                </div>
            </td>
        </tr>
    `).join("");
}

function updateSummary(items) {
    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = items.filter(transaction => {
        const date = new Date(transaction.date);

        return transaction.active &&
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear;
    });

    const income = currentMonthTransactions
        .filter(transaction => transaction.type === 1)
        .reduce((total, transaction) =>
            total + Number(transaction.amount), 0);

    const expense = currentMonthTransactions
        .filter(transaction => transaction.type === 2)
        .reduce((total, transaction) =>
            total + Number(transaction.amount), 0);

    document.getElementById("totalIncome").textContent =
        formatCurrency(income);

    document.getElementById("totalExpense").textContent =
        formatCurrency(expense);

    document.getElementById("monthBalance").textContent =
        formatCurrency(income - expense);
}

function applyFilters() {
    const type =
        document.getElementById("filterType").value;

    const accountId =
        document.getElementById("filterAccount").value;

    const categoryId =
        document.getElementById("filterCategory").value;

    const filtered = transactions.filter(transaction => {
        const matchesType =
            !type || transaction.type === Number(type);

        const matchesAccount =
            !accountId ||
            transaction.accountId === Number(accountId);

        const matchesCategory =
            !categoryId ||
            transaction.categoryId === Number(categoryId);

        return matchesType &&
            matchesAccount &&
            matchesCategory;
    });

    renderTransactions(filtered);
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

function openTransactionModal() {
    document.getElementById("transactionForm").reset();
    document.getElementById("transactionId").value = "";

    document.getElementById("transactionModalTitle").textContent =
        "Nova transação";

    document.getElementById("transactionDate").value =
        new Date().toISOString().split("T")[0];

    loadModalAccounts();
    loadModalCategories();

    document
        .getElementById("transactionModal")
        .classList.remove("hidden");
}

function closeTransactionModal() {
    document
        .getElementById("transactionModal")
        .classList.add("hidden");
}

function loadModalAccounts() {
    const select =
        document.getElementById("transactionAccount");

    select.innerHTML =
        '<option value="">Selecione uma conta</option>';

    accounts
        .filter(account => account.active)
        .forEach(account => {
            const option = document.createElement("option");

            option.value = account.id;
            option.textContent = account.name;

            select.appendChild(option);
        });
}

function loadModalCategories() {
    const select =
        document.getElementById("transactionCategory");

    const type = Number(
        document.getElementById("transactionType").value
    );

    select.innerHTML =
        '<option value="">Selecione uma categoria</option>';

    categories
        .filter(category =>
            category.active &&
            category.type === type
        )
        .forEach(category => {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            select.appendChild(option);
        });
}

async function saveTransaction(event) {
    event.preventDefault();

    const transactionId =
        document.getElementById("transactionId").value;

    const transaction = {
        description: document
            .getElementById("transactionDescription")
            .value
            .trim(),

        amount: Number(
            document.getElementById("transactionAmount").value
        ),

        date: document.getElementById("transactionDate").value,

        type: Number(
            document.getElementById("transactionType").value
        ),

        accountId: Number(
            document.getElementById("transactionAccount").value
        ),

        categoryId: Number(
            document.getElementById("transactionCategory").value
        ),

        notes: document
            .getElementById("transactionNotes")
            .value
            .trim()
    };

    const isEditing = transactionId !== "";

    if (isEditing) {
        transaction.active = true;
    }

    try {
        const response = await fetch(
            isEditing
                ? `/api/transactions/${transactionId}`
                : "/api/transactions",
            {
                method: isEditing ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify(transaction)
            }
        );

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            const message = await response.text();

            throw new Error(
                message || "Erro ao salvar transação."
            );
        }

        closeTransactionModal();

        await loadTransactions();

    } catch (error) {
        console.error(error);

        alert(
            error.message ||
            "Não foi possível salvar a transação."
        );
    }
}

async function editTransaction(id) {
    try {
        const response = await fetch(`/api/transactions/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao carregar transação.");
        }

        const transaction = await response.json();

        document.getElementById("transactionId").value =
            transaction.id;

        document.getElementById("transactionDescription").value =
            transaction.description;

        document.getElementById("transactionAmount").value =
            transaction.amount;

        document.getElementById("transactionDate").value =
            transaction.date.split("T")[0];

        document.getElementById("transactionType").value =
            transaction.type;

        document.getElementById("transactionNotes").value =
            transaction.notes ?? "";

        loadModalAccounts();
        loadModalCategories();

        document.getElementById("transactionAccount").value =
            transaction.accountId;

        document.getElementById("transactionCategory").value =
            transaction.categoryId;

        document.getElementById("transactionModalTitle").textContent =
            "Editar transação";

        document
            .getElementById("transactionModal")
            .classList.remove("hidden");

    } catch (error) {
        console.error(error);
        alert("Não foi possível carregar a transação.");
    }
}

async function deactivateTransaction(id) {
    const confirmed = confirm(
        "Deseja realmente excluir esta transação?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/transactions/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao excluir transação.");
        }

        await loadTransactions();

    } catch (error) {
        console.error(error);
        alert("Não foi possível excluir a transação.");
    }
}

function logout() {
    localStorage.removeItem("financeManagerToken");
    localStorage.removeItem("financeManagerUser");

    window.location.href = "/login.html";
}