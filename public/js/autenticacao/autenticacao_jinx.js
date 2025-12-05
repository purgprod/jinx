// public/autenticacao.js

document.addEventListener("DOMContentLoaded", () => {
    const mainContainer = document.getElementById("main-container");
    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("error-message");
    const logoutButton = document.getElementById("logoutButton"); // Referência ao botão logout
    let isRedirecting = false; // Flag para prevenir redirecionamento múltiplo

    // Função para redirecionar para a tela de login
    const redirecionarParaLogin = () => {
        if (!isRedirecting) {
            isRedirecting = true;
            console.log("Redirecionando para login");
            window.location.href = '/login';
        }
    };

    // Verifica se o usuário já está autenticado SOMENTE se não estiver na página de login
    const isLoginPage = window.location.pathname === '/login'; // Altere se necessário

    if (!isLoginPage) {
        fetch('/auth/check-session/jinx')
            .then(response => {
                console.log("Verificando sessão...");
                if (response.status === 401) {
                    redirecionarParaLogin();
                    throw new Error('Usuário não autenticado');
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.authenticated) {
                    console.log("Usuário autenticado");
                    mainContainer.style.display = 'flex';
                    mainContainer.classList.add("fade-in");
                }
            })
            .catch(error => {
                console.error('Erro ao verificar sessão:', error);
            });
    }

    // Lógica de login
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            fetch('/auth/login/jinx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.body.classList.add("fade-out");
                    setTimeout(() => {
                        window.location.href = '/'; // Redireciona após o login.
                    }, 1000);
                } else {
                    errorMessage.style.display = 'block'; // Mensagem de erro ao fazer login.
                }
            })
            .catch(error => {
                errorMessage.textContent = 'Erro ao tentar fazer login.';
                errorMessage.style.display = 'block';
                console.error('Erro no servidor:', error);
            });
        });
    }

    // Lógica de logout
    if (logoutButton) {
        logoutButton.addEventListener("click", (event) => {
            event.preventDefault(); // Previne o comportamento padrão do botão
            console.log("Botão Logout clicado");

            fetch('/auth/logout/jinx', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Logout bem-sucedido");
                    window.location.href = '/login'; // Redireciona para a tela de login
                } else {
                    console.error('Logout falhou:', data.message);
                    alert('Erro ao fazer logout: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro no servidor:', error);
                alert('Erro no servidor');
            });
        });
    }
});

