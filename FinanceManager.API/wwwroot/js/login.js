const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const errorMessage = document.getElementById("errorMessage");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    hideError();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "Entrando...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message ?? "Não foi possível realizar o login.");
            return;
        }

        localStorage.setItem("financeManagerToken", data.token);
        localStorage.setItem(
            "financeManagerUser",
            JSON.stringify(data.user)
        );

        window.location.href = "/index.html";
    } catch {
        showError("Não foi possível conectar ao servidor.");
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Entrar";
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}

function hideError() {
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}