// Função para mostrar os cartões no painel
function showUserCards() {
    const centralPanel = document.querySelector('.center-panel');
    if (centralPanel) {
        centralPanel.innerHTML = `
            <div class="card" id="criarNovoUsuarioCard" onclick="loadCreateUserForm()">
                <h2 class="card-title">Criar Novo Usuário</h2>
            </div>
            <div class="card" id="alterarUsuarioCard" onclick="showAlterUserCard()">
                <h2 class="card-title">Alterar Usuário Existente</h2>
            </div>
        `;
    }
}

// Função para mostrar o card de 'Alterar Usuário'
function showAlterUserCard() {
    const centralPanel = document.querySelector('.center-panel');
    if (centralPanel) {
        centralPanel.innerHTML = `
            <div class="form-container">
                <h2>Alterar Usuário</h2>
                <input type="email" id="emailParaAlterar" placeholder="E-mail do Usuário" required />
                <button onclick="fetchUserData()">Buscar Usuário</button>
                <button class="button-novo" onclick="showUserCards()">Voltar</button> <!-- Botão para voltar -->
                <div id="usuarioInfo"></div> <!-- Área para exibir informações do usuário -->
            </div>
        `;
    }
}

// Função para direcionar para o formulário de criação de novo usuário
function loadCreateUserForm() {
    const script = document.createElement('script');
    script.src = '/js/usuarios/criar_novo_usuario.js'; // Ajuste o caminho para o seu arquivo
    document.body.appendChild(script); // Carrega o script para mostrar o formulário
}

// Adiciona evento para carregar os cartões ao carregar a página
document.addEventListener("DOMContentLoaded", showUserCards); // Chama a função para exibir os cartões ao carregar a página

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
