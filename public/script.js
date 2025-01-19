document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");

    // Referências aos elementos do DOM
    const padraoButton = document.getElementById("padraoButton");
    const personalizadoButton = document.getElementById("personalizadoButton");
    const atualizarButton = document.getElementById("atualizarButton");
    const flagSelect = document.getElementById("flag-select");
    const mainContainer = document.getElementById("main-container");
    const usuariosButton = document.getElementById("usuariosButton");
    const resultadosButton = document.getElementById("resultadosButton");
    const tokensButton = document.getElementById("tokensButton");
    const alterarUsuarioButton = document.getElementById("alterarUsuarioButton"); // O botão para alterar usuário pode ser referenciado

    console.log("Element references initialized");

    // Adiciona evento ao botão "Usuários"
    if (usuariosButton) {
        usuariosButton.addEventListener("click", () => {
            console.log("Botão 'Usuários' clicado");
            showCreateUserCard(); // Mostra o cartão de criar novo usuário
        });
    }

    // Adiciona evento ao botão "Resultados Financeiros"
    if (resultadosButton) {
        resultadosButton.addEventListener("click", () => {
            console.log("Botão 'Resultados Financeiros' clicado");
            loadFinancialResults(); // Chama a função no resultados_financeiros.js
        });
    }

    // Adiciona evento ao botão "Tokens"
    if (tokensButton) {
        tokensButton.addEventListener("click", () => {
            console.log("Botão 'Tokens' clicado");
            loadTokensResults();  // Chama a função no tokens.js
        });
    }

    // Adiciona evento ao botão "Alterar Usuário"
    if (alterarUsuarioButton) { // Certifique-se que existe o botão no HTML
        alterarUsuarioButton.addEventListener("click", () => {
            console.log("Botão 'Alterar Usuário' clicado");
            showAlterUserCard(); // Chama a função para mostrar o cartão de alterar usuário
        });
    }
});

// Função para mostrar apenas o card de 'Criar Novo Usuário'
function showCreateUserCard() {
    const cardsContainer = document.getElementById('cardsContainer');
    if (cardsContainer) {
        // Limpa qualquer conteúdo anterior e mostra apenas o cartão de criação de usuário
        cardsContainer.innerHTML = `
            <div class="card" id="criarNovoUsuarioCard">
                <h2 class="card-title">Criar Novo Usuário</h2>
                <input type="text" id="novoNome" placeholder="Nome" required />
                <input type="email" id="novoEmail" placeholder="Email" required />
                <input type="password" id="newUserPassword" placeholder="Senha" required />
                <button class="button-novo" onclick="createUser()">Criar Usuário</button>
            </div>
        `;
    }
}

// Função para mostrar o card de 'Alterar Usuário'
function showAlterUserCard() {
    const cardsContainer = document.getElementById('cardsContainer');
    if (cardsContainer) {
        // Limpa qualquer conteúdo anterior e mostra apenas o cartão de alteração de usuário
        cardsContainer.innerHTML = `
            <div class="card" id="alterarUsuarioCard">
                <h2 class="card-title">Alterar Usuário</h2>
                <input type="email" id="emailParaAlterar" placeholder="E-mail do Usuário" required />
                <button class="button-novo" onclick="fetchUserData()">Buscar Usuário</button>
                <div id="usuarioInfo"></div> <!-- Área para exibir informações do usuário -->
            </div>
        `;
    }
}

// Função para buscar dados do usuário pelo e-mail
function fetchUserData() {
    const email = document.getElementById('emailParaAlterar').value;

    // Verificar se o e-mail foi digitado
    if (!email) {
        alert('Por favor, insira um e-mail.');
        return;
    }

    // Chamada para buscar os dados do usuário
    fetch(`/api/usuarios/${encodeURIComponent(email)}`) // Endpoint para buscar dados do usuário
    .then(response => {
        if (response.ok) {
            return response.json(); // Converte a resposta em JSON
        } else {
            throw new Error('Usuário não encontrado.');
        }
    })
    .then(userData => {
        displayUserInfo(userData); // Exibe as informações do usuário
    })
    .catch(error => {
        console.error(error);
        alert(error.message);
    });
}

// Função para exibir as informações do usuário em forma de cartão
function displayUserInfo(userData) {
    const usuarioInfoContainer = document.getElementById('usuarioInfo');
    if (usuarioInfoContainer) {
        usuarioInfoContainer.innerHTML = `
            <div class="user-card">
                <h3>Nome: ${userData.nome}</h3>
                <p>Email: ${userData.email}</p>
            </div>
        `;
    }
}

// Função para criar um novo usuário
function createUser() {
    const nome = document.getElementById('novoNome').value; // Obtenha o nome do campo de entrada
    const email = document.getElementById('novoEmail').value; // Obtenha o email do campo de entrada
    const password = document.getElementById('newUserPassword').value; // Obtenha a senha do campo de entrada

    // Primeiro, obtenha o próximo usuario_id
    fetch('/api/usuarios/next-id') // Endpoint para obter o próximo usuario_id
        .then(response => {
            if (!response.ok) throw new Error('Erro ao obter próximo usuario_id');
            return response.json(); // Processa a resposta como JSON
        })
        .then(data => {
            const usuarioId = data.nextId; // Supondo que a resposta será um objeto com próximo id

            // Agora, faça a chamada para criar o usuário
            return fetch('/api/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usuario_id: usuarioId,
                    nome: nome,
                    email: email,
                    password: password, // Se você quiser passar a senha, utilize o valor obtido
                    created_at: new Date().toISOString() // Data e hora atuais
                }),
            });
        })
        .then(response => {
            if (response.ok) {
                alert('Usuário criado com sucesso!');
                // Você pode optar por recarregar ou mostrar todos os usuários após a criação
                loadUsers(); // Se precisar usar a listagem novamente
            } else {
                alert('Erro ao criar usuário.');
            }
        })
        .catch(error => {
            console.error('Erro ao criar usuário:', error);
            alert('Erro ao criar usuário.');
        });
}
