const registerForm = document.getElementById("registerForm");
const registerButton = document.getElementById("registerButton");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    hideMessages();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        showError("As senhas não coincidem.");
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = "Criando conta...";

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password,
                confirmPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(
                data.message ?? "Não foi possível criar a conta."
            );

            return;
        }

        showSuccess("Conta criada com sucesso. Redirecionando...");

        setTimeout(() => {
            window.location.href = "/login.html";
        }, 1500);
    } catch {
        showError("Não foi possível conectar ao servidor.");
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = "Criar conta";
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = "block";
}

function hideMessages() {
    errorMessage.textContent = "";
    errorMessage.style.display = "none";

    successMessage.textContent = "";
    successMessage.style.display = "none";
}