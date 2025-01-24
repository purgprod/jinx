let userDataMap = {}; // Armazena os dados dos usuários localmente
let showInactiveUsers = false; // Por padrão, usuários inativos não são exibidos

// Função para mostrar os botões no painel
function showUserCards() {
    const centralPanel = document.querySelector('.center-panel');
    if (centralPanel) {
        centralPanel.innerHTML = `
	    <h2>Resultados Financeiros</h2>
	    <div class="button-container">
                <input type="email" id="emailParaAlterar" placeholder="E-mail do Usuário" required />
                <button id="buscarButton" class="button-verde">Buscar Usuário</button>
                <button id="criarNovoUsuarioButton" class="button-azul">Criar Novo Usuário</button>
                <button id="inativosUsuarioButton" class="button-vermelho">${showInactiveUsers ? "Mostrar Usuários Inativos" : "Mostrar Usuários Inativos"}</button>
            </div>
            <div id="usersContainer" class="cards-container"></div>
        `;

        // Adiciona eventos de clique aos botões
        addUserButtonEventListeners();
    }
}

// Função para adicionar eventos de clique aos botões de controle
function addUserButtonEventListeners() {
    const criarNovoUsuarioButton = document.getElementById('criarNovoUsuarioButton');
    if (criarNovoUsuarioButton) {
        criarNovoUsuarioButton.addEventListener('click', loadCreateUserForm);
    }

    const buscarButton = document.getElementById('buscarButton');
    if (buscarButton) {
        buscarButton.addEventListener('click', filterUsers);
    }

    const inativosUsuarioButton = document.getElementById('inativosUsuarioButton');
    if (inativosUsuarioButton) {
        inativosUsuarioButton.addEventListener('click', () => {
            showInactiveUsers = !showInactiveUsers;
            filterUsers(); // Atualiza a exibição dos usuários
        });
    }
}

// Função para recarregar a página
function refreshPage() {
    location.reload(); // Recarrega a página inteira
}

// Função para carregar os resultados dos usuários
function loadUserResults() {
    console.log("Iniciando chamada para '/api/usuarios'");
    fetch('/api/usuarios')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na resposta: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados recebidos do servidor:", data);

            // Armazena os dados dos usuários para rápido acesso
            data.forEach(user => {
                userDataMap[user.usuario_id] = user;
            });

            // Exibe os componentes iniciais
            showUserCards();

            // Carrega os usuários no HTML
            filterUsers(); // Atualiza a exibição inicial de usuários
        })
        .catch(error => {
            console.error("Erro ao buscar usuários:", error);
        });
}

// Função para realizar operações de ativação/inativação
function toggleUserStatus(userId, isActive) {
    const statusEndpoint = isActive ? `/api/usuarios/${userId}/ativar` : `/api/usuarios/${userId}/inativar`;
    fetch(statusEndpoint, { method: 'POST' })
        .then(response => {
            if (response.ok) {
                console.log(`Usuário ${isActive ? 'ativado' : 'inativado'} com sucesso`);
                refreshPage(); // Recarrega a página após a operação
            } else {
                alert(`Erro ao ${isActive ? 'ativar' : 'inativar'} o usuário.`);
            }
        })
        .catch(error => {
            console.error(`Erro ao ${isActive ? 'ativar' : 'inativar'} o usuário:`, error);
        });
}

// Função para criar um novo usuário
function createUser(userData) {
    fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    })
    .then(response => {
        if (response.ok) {
            console.log("Usuário criado com sucesso.");
            refreshPage(); // Recarrega a página após criação de um novo usuário
        } else {
            alert("Erro ao criar usuário.");
        }
    })
    .catch(error => {
        console.error("Erro ao criar usuário:", error);
    });
}

// Filtrar os usuários pelo e-mail digitado e status
function filterUsers() {
    const email = document.getElementById('emailParaAlterar').value.toLowerCase();
    let filteredUsers = Object.values(userDataMap).filter(user => showInactiveUsers || user.status_ativo === 1);

    if (email) {
        filteredUsers = filteredUsers.filter(user => user.email.toLowerCase().includes(email));
    }

    const usersContainer = document.getElementById('usersContainer');
    if (usersContainer) {
        usersContainer.innerHTML = createCardsHTML(filteredUsers);
        addCardEventListeners();
    }
}

// Função para criar o HTML dos cartões de usuários filtrados
function createCardsHTML(users) {
    return users.map(user => `
        <div class="card" data-id="${user.usuario_id}">
            <h3 class="card-title">Nome: ${user.nome}</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            ${user.status_ativo === 0 ? `<p class="inactive-label" style="color: red;"><strong>Inativo</strong></p>` : ''}
        </div>
    `).join('');
}

// Adiciona evento de clique nos cartões de usuário para abrir detalhes
function addCardEventListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const usuarioId = card.getAttribute('data-id');
            loadUserDetails(usuarioId);
        });
    });
}

// Função para direcionar para o formulário de criação de novo usuário
function loadCreateUserForm() {
    const script = document.createElement('script');
    script.src = '/js/usuarios/criar_novo_usuario.js';
    script.onload = () => {
        if (typeof loadCreateUserFormInterface === 'function') {
            loadCreateUserFormInterface();
        }
    };
    document.body.appendChild(script);
}

// Adiciona  evento para carregar a busca e criação de usuários ao carregar a página
document.addEventListener("DOMContentLoaded", loadUserResults);

// Torna a função acessível no escopo global
window.showUserCards = showUserCards;

