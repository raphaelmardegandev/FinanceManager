const token = localStorage.getItem("financeManagerToken");
const userData = localStorage.getItem("financeManagerUser");

if (!token || !userData) {
    window.location.href = "/login.html";
}

const loggedUser = JSON.parse(userData);

document.addEventListener("DOMContentLoaded", () => {
    renderLoggedUser();
    loadCategories();

    document
        .getElementById("categoryForm")
        .addEventListener("submit", saveCategory);
});

function renderLoggedUser() {
    document.getElementById("userName").textContent = loggedUser.name;
    document.getElementById("userEmail").textContent = loggedUser.email;

    const firstLetter = loggedUser.name
        ? loggedUser.name.charAt(0).toUpperCase()
        : "U";

    document.getElementById("userAvatar").textContent = firstLetter;
}

async function loadCategories() {
    const table = document.getElementById("categoriesTable");

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

        const categories = await response.json();

        renderCategories(categories);

    } catch (error) {
        console.error(error);

        table.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    Não foi possível carregar as categorias.
                </td>
            </tr>
        `;
    }
}

function renderCategories(categories) {
    const table = document.getElementById("categoriesTable");

    if (categories.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    Nenhuma categoria cadastrada.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = categories.map(category => `
        <tr>
            <td>${category.name}</td>

            <td>${category.description || "-"}</td>

            <td>
                <span class="type-badge ${category.type === 1
            ? "type-income"
            : "type-expense"
        }">
                    ${category.type === 1 ? "Receita" : "Despesa"}
                </span>
            </td>

            <td>
                <span class="account-status ${category.active ? "active" : "inactive"
        }">
                    ${category.active ? "Ativa" : "Inativa"}
                </span>
            </td>

            <td class="actions-column">
                <div class="table-actions">
                    <button
                        class="action-button edit"
                        onclick="editCategory(${category.id})">
                        Editar
                    </button>

                    ${category.active ? `
                        <button
                            class="action-button danger"
                            onclick="deactivateCategory(${category.id})">
                            Inativar
                        </button>
                    ` : `
                        <button
                            class="action-button activate"
                            onclick="activateCategory(${category.id})">
                            Ativar
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `).join("");
}

function openCategoryModal() {
    document.getElementById("categoryForm").reset();
    document.getElementById("categoryId").value = "";
    document.getElementById("categoryModalTitle").textContent =
        "Nova categoria";

    document
        .getElementById("categoryModal")
        .classList.remove("hidden");
}

function closeCategoryModal() {
    document
        .getElementById("categoryModal")
        .classList.add("hidden");
}

async function saveCategory(event) {
    event.preventDefault();

    const categoryId = document.getElementById("categoryId").value;

    const category = {
        name: document.getElementById("categoryName").value.trim(),
        description: document
            .getElementById("categoryDescription")
            .value
            .trim(),
        type: Number(
            document.getElementById("categoryType").value
        )
    };

    const isEditing = categoryId !== "";

    if (isEditing) {
        category.active = true;
    }

    try {
        const response = await fetch(
            isEditing
                ? `/api/categories/${categoryId}`
                : "/api/categories",
            {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(category)
            }
        );

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(
                isEditing
                    ? "Erro ao atualizar categoria."
                    : "Erro ao cadastrar categoria."
            );
        }

        closeCategoryModal();
        await loadCategories();

    } catch (error) {
        console.error(error);

        alert(
            isEditing
                ? "Não foi possível atualizar a categoria."
                : "Não foi possível cadastrar a categoria."
        );
    }
}

async function editCategory(id) {
    try {
        const response = await fetch(`/api/categories/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao carregar categoria.");
        }

        const category = await response.json();

        document.getElementById("categoryId").value = category.id;
        document.getElementById("categoryName").value = category.name;
        document.getElementById("categoryDescription").value =
            category.description ?? "";
        document.getElementById("categoryType").value = category.type;

        document.getElementById("categoryModalTitle").textContent =
            "Editar categoria";

        document
            .getElementById("categoryModal")
            .classList.remove("hidden");

    } catch (error) {
        console.error(error);
        alert("Não foi possível carregar a categoria.");
    }
}

async function deactivateCategory(id) {
    const confirmed = confirm(
        "Deseja realmente inativar esta categoria?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/categories/${id}`, {
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
            throw new Error("Erro ao inativar categoria.");
        }

        await loadCategories();

    } catch (error) {
        console.error(error);
        alert("Não foi possível inativar a categoria.");
    }
}

async function activateCategory(id) {
    try {
        const getResponse = await fetch(`/api/categories/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (getResponse.status === 401) {
            logout();
            return;
        }

        if (!getResponse.ok) {
            throw new Error("Erro ao carregar categoria.");
        }

        const category = await getResponse.json();

        const response = await fetch(`/api/categories/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: category.name,
                description: category.description,
                type: category.type,
                active: true
            })
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao ativar categoria.");
        }

        await loadCategories();

    } catch (error) {
        console.error(error);
        alert("Não foi possível ativar a categoria.");
    }
}

function logout() {
    localStorage.removeItem("financeManagerToken");
    localStorage.removeItem("financeManagerUser");

    window.location.href = "/login.html";
}