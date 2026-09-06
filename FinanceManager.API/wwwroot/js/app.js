const categoriesTable = document.getElementById("categoriesTable");
const categoryCount = document.getElementById("categoryCount");
const incomeCategories = document.getElementById("incomeCategories");
const expenseCategories = document.getElementById("expenseCategories");

const token = localStorage.getItem("financeManagerToken");
const userData = localStorage.getItem("financeManagerUser");

if (!token || !userData) {
    window.location.href = "/login.html";
}

const loggedUser = JSON.parse(userData);

document.addEventListener("DOMContentLoaded", () => {
    renderLoggedUser();
    loadCategories();
});

if (!token) {
    window.location.href = "/login.html";
}

function renderLoggedUser() {
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    const userAvatar = document.getElementById("userAvatar");

    userName.textContent = loggedUser.name;
    userEmail.textContent = loggedUser.email;

    const firstLetter = loggedUser.name
        ? loggedUser.name.charAt(0).toUpperCase()
        : "U";

    userAvatar.textContent = firstLetter;
}

async function loadCategories() {
    try {
        const response = await fetch("/api/categories", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Não foi possível carregar as categorias.");
        }

        const categories = await response.json();

        renderCategories(categories);
    } catch (error) {
        categoriesTable.innerHTML = `
            <tr>
                <td colspan="4" class="loading">
                    Erro ao carregar categorias.
                </td>
            </tr>
        `;

        console.error(error);
    }
}

function renderCategories(categories) {
    categoryCount.textContent = categories.length;

    const incomeCount = categories.filter(x => x.type === 1).length;
    const expenseCount = categories.filter(x => x.type === 2).length;

    incomeCategories.textContent = incomeCount;
    expenseCategories.textContent = expenseCount;

    if (categories.length === 0) {
        categoriesTable.innerHTML = `
            <tr>
                <td colspan="4" class="loading">
                    Nenhuma categoria cadastrada.
                </td>
            </tr>
        `;

        return;
    }

    categoriesTable.innerHTML = categories.map(category => {
        const isIncome = category.type === 1;

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(category.name)}</strong>
                </td>

                <td>
                    ${escapeHtml(category.description || "-")}
                </td>

                <td>
                    <span class="type-badge ${
                        isIncome
                            ? "type-income"
                            : "type-expense"
                    }">
                        ${isIncome ? "Receita" : "Despesa"}
                    </span>
                </td>

                <td>
                    <span class="status-badge">
                        ${category.active ? "Ativa" : "Inativa"}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}

function openCategoryModal() {
    document
        .getElementById("categoryModal")
        .classList.remove("hidden");
}

function closeCategoryModal() {
    document
        .getElementById("categoryModal")
        .classList.add("hidden");

    document
        .getElementById("categoryForm")
        .reset();
}

document
    .getElementById("categoryForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const request = {
            name: document.getElementById("categoryName").value,
            description: document.getElementById("categoryDescription").value,
            type: Number(
                document.getElementById("categoryType").value
            )
        };

        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(request)
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error("Não foi possível criar a categoria.");
            }

            closeCategoryModal();

            await loadCategories();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });

function logout() {
    localStorage.removeItem("financeManagerToken");
    localStorage.removeItem("financeManagerUser");

    window.location.href = "/login.html";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}