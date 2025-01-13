document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");

    // Referências aos elementos do DOM
    const padraoButton = document.getElementById("padraoButton");
    const personalizadoButton = document.getElementById("personalizadoButton");
    const atualizarButton = document.getElementById("atualizarButton");
    const flagSelect = document.getElementById("flag-select");
    const logoutButton = document.getElementById("logoutButton");
    const loginForm = document.getElementById("loginForm");
    const mainContainer = document.getElementById("main-container");
    const usuariosButton = document.getElementById("usuariosButton");
    const resultadosButton = document.getElementById("resultadosButton");

    console.log("Element references initialized");

    // Função para redirecionar para a tela de login
    const redirecionarParaLogin = () => {
        console.log("Redirecionando para login");
        window.location.href = '/login';
    };

    // Verifica se o usuário já está autenticado
    fetch('/auth/check-session')
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

    // Função para lidar com o login
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            console.log("Tentando login com email:", email);

            fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Login bem-sucedido");
                    loginForm.classList.add("fade-out");
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    console.error('Login falhou: ' + data.message);
                    alert('Login falhou: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro no servidor:', error);
                alert('Erro no servidor');
            });
        });
    }

    // Adicionar eventos aos botões
    if (logoutButton) {
        logoutButton.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("Botão Logout clicado");
            mainContainer.classList.add("fade-out");
            setTimeout(() => {
                fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro no logout');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        console.log("Logout bem-sucedido");
                        window.location.href = '/login';
                    } else {
                        console.error('Logout falhou: ' + data.message);
                        alert('Erro ao fazer logout: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Erro no servidor:', error);
                    alert('Erro no servidor');
                });
            }, 1000);
        });
    }

    // Adiciona evento ao botão "Usuários"
    if (usuariosButton) {
        usuariosButton.addEventListener("click", () => {
            console.log("Botão 'Usuários' clicado");
            loadUsers(); // Certifique-se de que a função loadUsers está definida no usuarios.js
        });
    }

    // Adiciona evento ao botão "Resultados Financeiros"
    if (resultadosButton) {
        resultadosButton.addEventListener("click", () => {
            console.log("Botão 'Resultados Financeiros' clicado");
            loadFinancialResults(); // Chama a função no resultados.js
        });
    }
});

