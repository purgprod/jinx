let userDataMap = {}; // Objeto para armazenar os dados localmente

function loadUsers() {
    console.log("Iniciando chamada para '/api/usuarios'");

    // Fazer a chamada à API para buscar os dados dos usuários
    fetch('/api/usuarios') // Aqui deve ser o endpoint correto
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na resposta: ${response.status}`);
            }
            return response.json(); // Processa a resposta como JSON
        })
        .then(data => {
            console.log("Dados recebidos do servidor:", data);

            // Armazena os dados em um mapa para acesso rápido
            data.forEach(user => {
                userDataMap[user.usuario_id] = user; // Certifique-se de que o nome da propriedade está correto
            });

            // Mapeia os resultados dos usuários para exibição
            const userResults = data.map(user => `
                <div class="user-card" data-id="${user.usuario_id}">
                    <h3 class="user-title">${user.nome}</h3>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Data de Criação:</strong> ${new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                    <button onclick="openChangePasswordModal('${user.usuario_id}')">Alterar Senha</button>
                </div>
            `).join('');

            // Atualiza o conteúdo do painel central
            const centerPanel = document.querySelector('.center-panel');
            if (centerPanel) {
                centerPanel.innerHTML = `
                    <h2 class="bets-title">Usuários</h2>
                    <div id="userCardsContainer" class="user-cards-container">
                        ${userResults}
                    </div>
                `;
            } else {
                console.error('Elemento center-panel não encontrado.');
            }
        })
        .catch(error => {
            console.error("Erro ao buscar usuários:", error);
        });
}

function openChangePasswordModal(userId) {
    // Cria o modal de entrada de senha
    const modalHtml = `
        <div id="passwordModal" style="display: block;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2>Alterar Senha</h2>
                <input type="password" id="newPassword" placeholder="Nova Senha" required />
                <button onclick="changePassword('${userId}')">Salvar</button>
                <button onclick="closePasswordModal()">Cancelar</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.remove(); // Remove o modal do DOM
    }
}

function changePassword(userId) { // userId é agora passado como argumento
    const newPassword = document.getElementById('newPassword').value; // Obtém a nova senha

    if (!userId) {
        console.error('ID do usuário não encontrado');
        alert('Erro: ID do usuário não encontrado.');
        return; // Retorna e evita a chamada se o ID não existir
    }

    if (newPassword) {
        // Chamada à API para alterar a senha
        fetch(`/api/usuarios/${userId}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: newPassword }),
        })
        .then(response => {
            if (response.ok) {
                alert('Senha alterada com sucesso!');
                closePasswordModal(); // Fecha o modal
                loadUsers(); // Recarrega a lista de usuários para refletir as alterações
            } else {
                alert('Erro ao alterar a senha.');
            }
        })
        .catch(error => {
            console.error('Erro ao alterar a senha:', error);
            alert('Erro ao alterar a senha.');
        });
    } else {
        alert('Por favor, digite uma nova senha.');
    }
}

// Função para criar um novo usuário
function createUser() {
    const nome = document.getElementById('nome').value; // Obtenha o nome do campo de entrada
    const email = document.getElementById('email').value; // Obtenha o email do campo de entrada
    const password = document.getElementById('newUserPassword').value; // Obtenha a senha do campo de entrada

    fetch('/api/usuarios', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, password }),
    })
    .then(response => {
        if (response.ok) {
            alert('Usuário criado com sucesso!');
            loadUsers(); // Recarrega a lista de usuários após a criação
        } else {
            alert('Erro ao criar usuário.');
        }
    })
    .catch(error => {
        console.error('Erro ao criar usuário:', error);
        alert('Erro ao criar usuário.');
    });
}

// Torna a função acessível no escopo global
window.loadUsers = loadUsers; // Faça a função acessível globalmente
window.createUser = createUser; // Torna createUser acessível globalmente

// Chamada para carregar usuários quando a página for carregada
document.addEventListener('DOMContentLoaded', loadUsers);
