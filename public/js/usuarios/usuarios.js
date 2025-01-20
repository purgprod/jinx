let userDataMap = {}; // Armazena os dados dos usuários localmente

// Função para mostrar os botões no painel
function showUserCards() {
    const centralPanel = document.querySelector('.center-panel');
    if (centralPanel) {
        centralPanel.innerHTML = `
            <div class="button-container">
                <input type="email" id="emailParaAlterar" placeholder="E-mail do Usuário" required />
                <button id="buscarButton" class="button-verde">Buscar Usuário</button>
		<button id="criarNovoUsuarioButton" class="button-azul">Criar Novo Usuário</button>
            </div>
            <div id="usersContainer" class="cards-container"></div>
        `;
        
        // Adiciona eventos de clique aos botões
        const criarNovoUsuarioButton = document.getElementById('criarNovoUsuarioButton');
        if (criarNovoUsuarioButton) {
            criarNovoUsuarioButton.addEventListener('click', loadCreateUserForm);
        }

        const buscarButton = document.getElementById('buscarButton');
        if (buscarButton) {
            buscarButton.addEventListener('click', filterUsers);
        }
    }
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
        })
        .catch(error => {
            console.error("Erro ao buscar usuários:", error);
        });
}

// Filtrar os usuários pelo e-mail digitado
function filterUsers() {
    const email = document.getElementById('emailParaAlterar').value.toLowerCase();
    let filteredUsers = Object.values(userDataMap);

    if (email) {
        filteredUsers = filteredUsers.filter(user => user.email.toLowerCase().includes(email));
    }

    const usersContainer = document.getElementById('usersContainer');
    if (usersContainer) {
        usersContainer.innerHTML = createCardsHTML(filteredUsers);
    }
}

// Função para criar o HTML dos cartões de usuários filtrados
function createCardsHTML(users) {
    return users.map(user => `
        <div class="card" data-id="${user.usuario_id}">
            <h3 class="card-title">Nome: ${user.nome}</h3>
            <p><strong>Email:</strong> ${user.email}</p>
        </div>
    `).join('');
}

// Função para direcionar para o formulário de criação de novo usuário
function loadCreateUserForm() {
    const script = document.createElement('script');
    script.src = '/js/usuarios/criar_novo_usuario.js'; // Ajuste o caminho para o seu arquivo
    script.onload = () => {
        if (typeof loadCreateUserFormInterface === 'function') {
            loadCreateUserFormInterface(); // Inicia a interface após carregar o script
        }
    };
    document.body.appendChild(script);
}

// Adiciona evento para carregar a busca e criação de usuários ao carregar a página
document.addEventListener("DOMContentLoaded", loadUserResults);

// Torna a função acessível no escopo global
window.showUserCards = showUserCards;

