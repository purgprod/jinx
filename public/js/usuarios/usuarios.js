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
            </div>
        `;
    }
}

// Função para direcionar para o formulário de criação de novo usuário
function loadCreateUserForm() {
    const script = document.createElement('script');
    script.src = '/js/usuarios/criar_novo_usuario.js'; // Ajuste o caminho para o seu arquivo
    document.body.appendChild(script); // Carrega o script para mostrar o formulario
}

// Adiciona evento para carregar os cartões ao carregar a página
document.addEventListener("DOMContentLoaded", showUserCards); // Chama a função para exibir os cartões ao carregar a página
