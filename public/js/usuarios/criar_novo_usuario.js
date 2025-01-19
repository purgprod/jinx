// Função para carregar o formulário de criação de novo usuário
function loadCreateUserForm() {
    const centralPanel = document.querySelector('.center-panel');

    if (centralPanel) {
        centralPanel.innerHTML = `
            <div class="form-container">
                <h2>Preencha os Dados do Novo Usuário</h2>
                <input type="text" id="novoNome" placeholder="Nome" required />
                <input type="email" id="novoEmail" placeholder="E-mail" required />
                <button class="button-novo" onclick="submitNewUser()">Criar Usuário</button>
                <button class="button-novo" onclick="showUserCards()">Voltar</button>
            </div>
        `;
    }
}

// Função para retornar à tela de cartões
function showUserCards() {
    const centralPanel = document.querySelector('.center-panel');
    if (centralPanel) {
        centralPanel.innerHTML = `
            <div class="card" id="criarNovoUsuarioCard" onclick="loadCreateUserForm()">
                <h2 class="card-title">Criar Novo Usuário</h2>
            </div>
            <div class="card" id="alterarUsuarioCard" onclick="loadAlterarUsuario()">
                <h2 class="card-title">Alterar Usuário Existente</h2>
            </div>
        `;
    }
}

// Função para enviar os dados do novo usuário
function submitNewUser() {
    const nome = document.getElementById('novoNome').value;
    const email = document.getElementById('novoEmail').value;

    // Senha padrão
    const password = 'purg123';

    // Enviar os dados para criar um novo usuário
    fetch('/api/usuarios', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, password }), // Enviando os dados
    })
    .then(response => {
        if (response.ok) {
            alert('Usuário criado com sucesso!'); // Sucesso
            showUserCards(); // Retorna à tela de cartões
        } else {
            alert('Erro ao criar usuário.'); // Mensagem de erro
        }
    })
    .catch(error => {
        console.error('Erro ao criar usuário:', error); // Log de erro
        alert('Erro ao criar usuário.'); // Mensagem de erro
    });
}
