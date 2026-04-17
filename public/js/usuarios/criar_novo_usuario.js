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

// Função para enviar os dados do novo usuário
function submitNewUser() {
    const nome_completo = document.getElementById('novoNome').value;
    const email = document.getElementById('novoEmail').value;

    // Senha padrão
    const password = 'purg123';

    // Enviar os dados para criar um novo usuário
    fetch('/api/usuarios', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome_completo, email, password }),
    })
    .then(response => {
        if (response.ok) {
            alert('Usuário criado com sucesso!'); // Sucesso
            location.reload(); // Recarrega a página para mostrar os usuários atualizados
        } else {
            alert('Erro ao criar usuário.'); // Mensagem de erro
        }
    })
    .catch(error => {
        console.error('Erro ao criar usuário:', error); // Log de erro
        alert('Erro ao criar usuário.'); // Mensagem de erro
    });
}

