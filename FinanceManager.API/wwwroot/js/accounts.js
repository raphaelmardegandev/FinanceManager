const token = localStorage.getItem("financeManagerToken");
const userData = localStorage.getItem("financeManagerUser");

if (!token || !userData) {
    window.location.href = "/login.html";
}

const loggedUser = JSON.parse(userData);

document.addEventListener("DOMContentLoaded", () => {
    renderLoggedUser();
    loadAccounts();

    document
        .getElementById("accountForm")
        .addEventListener("submit", saveAccount);
});

function renderLoggedUser() {
    document.getElementById("userName").textContent = loggedUser.name;
    document.getElementById("userEmail").textContent = loggedUser.email;

    const firstLetter = loggedUser.name
        ? loggedUser.name.charAt(0).toUpperCase()
        : "U";

    document.getElementById("userAvatar").textContent = firstLetter;
}

async function loadAccounts() {
    const table = document.getElementById("accountsTable");

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

        const accounts = await response.json();

        renderAccounts(accounts);
    } catch (error) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    Não foi possível carregar as contas.
                </td>
            </tr>
        `;

        console.error(error);
    }
}

function renderAccounts(accounts) {
    const table = document.getElementById("accountsTable");

    if (accounts.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    Nenhuma conta cadastrada.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = accounts.map(account => `
        <tr>
            <td>${account.name}</td>

            <td>
                ${getAccountTypeName(account.type)}
            </td>

            <td>
                <span class="account-balance">
                    ${formatCurrency(account.initialBalance)}
                </span>
            </td>

            <td>
                <span class="account-status ${account.active ? "active" : "inactive"}">
                    ${account.active ? "Ativa" : "Inativa"}
                </span>
            </td>

            <td class="actions-column">
                <div class="table-actions">

                    <button
                        class="action-button edit"
                        onclick="editAccount(${account.id})">
                        Editar
                    </button>


                    ${account.active ? `
                        <button
                            class="action-button danger"
                            onclick="deactivateAccount(${account.id})">
                            Inativar
                        </button>
                    ` : `
                        <button
                            class="action-button activate"
                            onclick="activateAccount(${account.id})">
                            Ativar
                        </button>
                    `}

                </div>
            </td>
        </tr>
    `).join("");
}

function getAccountTypeName(type) {
    const types = {
        1: "Conta corrente",
        2: "Conta poupança",
        3: "Carteira",
        4: "Investimento",
        5: "Outro"
    };

    return types[type] ?? "Outro";
}

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function openAccountModal() {
    document.getElementById("accountForm").reset();
    document.getElementById("accountId").value = "";
    document.getElementById("accountInitialBalance").value = "0";
    document.getElementById("accountModalTitle").textContent = "Nova conta";

    document
        .getElementById("accountModal")
        .classList.remove("hidden");
}

function closeAccountModal() {
    document
        .getElementById("accountModal")
        .classList.add("hidden");
}

async function saveAccount(event) {
    event.preventDefault();

    const accountId = document.getElementById("accountId").value;

    const account = {
        name: document.getElementById("accountName").value.trim(),
        type: Number(document.getElementById("accountType").value),
        initialBalance: Number(
            document.getElementById("accountInitialBalance").value
        )
    };

    const isEditing = accountId !== "";

    if (isEditing) {
        account.active = true;
    }

    try {
        const response = await fetch(
            isEditing
                ? `/api/accounts/${accountId}`
                : "/api/accounts",
            {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(account)
            }
        );

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(
                isEditing
                    ? "Erro ao atualizar conta."
                    : "Erro ao cadastrar conta."
            );
        }

        closeAccountModal();
        await loadAccounts();

    } catch (error) {
        console.error(error);

        alert(
            isEditing
                ? "Não foi possível atualizar a conta."
                : "Não foi possível cadastrar a conta."
        );
    }
}

async function editAccount(id) {
    try {
        const response = await fetch(`/api/accounts/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao carregar conta.");
        }

        const account = await response.json();

        document.getElementById("accountId").value = account.id;
        document.getElementById("accountName").value = account.name;
        document.getElementById("accountType").value = account.type;
        document.getElementById("accountInitialBalance").value =
            account.initialBalance;

        document.getElementById("accountModalTitle").textContent =
            "Editar conta";

        document
            .getElementById("accountModal")
            .classList.remove("hidden");

    } catch (error) {
        console.error(error);
        alert("Não foi possível carregar a conta.");
    }
}

async function deactivateAccount(id) {
    const confirmed = confirm(
        "Deseja realmente inativar esta conta?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/accounts/${id}`, {
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
            throw new Error("Erro ao inativar conta.");
        }

        await loadAccounts();

    } catch (error) {
        console.error(error);
        alert("Não foi possível inativar a conta.");
    }
}

async function activateAccount(id) {
    try {
        const getResponse = await fetch(`/api/accounts/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (getResponse.status === 401) {
            logout();
            return;
        }

        if (!getResponse.ok) {
            throw new Error("Erro ao carregar conta.");
        }

        const account = await getResponse.json();

        const response = await fetch(`/api/accounts/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: account.name,
                type: account.type,
                initialBalance: account.initialBalance,
                active: true
            })
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao ativar conta.");
        }

        await loadAccounts();

    } catch (error) {
        console.error(error);
        alert("Não foi possível ativar a conta.");
    }
}

function logout() {
    localStorage.removeItem("financeManagerToken");
    localStorage.removeItem("financeManagerUser");

    window.location.href = "/login.html";
}