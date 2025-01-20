let userDataMapaosidaosdasfkafdsf = {}; // Objeto para armazenar os dados de usuários localmente
let showInactiveUsers = false; // Controle para exibir usuários desativados

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

            // Armazena os dados em um mapa para acesso rápido
            data.forEach(user => {
                userDataMap[user.usuario_id] = user;
            });

            // Filtra os dados para exibir apenas os ativos, se necessário
            const filterData = () => {
                return data.filter(user => showInactiveUsers || user.status_ativo === 1);
            };

            // Cria o HTML dos cartões de usuários
            const createCardsHTML = (filteredData) => {
                return filteredData.map(user => `
                    <div class="card" data-id="${user.usuario_id}">
                        <h3 class="card-title">Nome: ${user.nome}</h3>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <button class="button-vermelho" onclick="deleteUser('${user.usuario_id}')">Excluir Usuário</button>
                        ${user.status_ativo === 0 ? `<p class="inactive-label" style="color: red;"><strong>Inativo</strong></p>` : ''}
                    </div>
                `).join('');
            };

            // Atualiza o conteúdo do painel central
            const centerPanel = document.querySelector('.center-panel');
            if (centerPanel) {
                const filteredData = filterData();
                centerPanel.innerHTML = `
                    <div class="button-container">
                        <input type="email" id="emailParaAlterar" placeholder="E-mail do Usuário" required />
                        <button id="buscarButton" class="button-azul">Buscar Usuário</button>
                        <button id="toggleInactiveButton" class="button-vermelho">${showInactiveUsers ? "Ocultar Inativos" : "Mostrar Inativos"}</button>
                    </div>
                    <div id="usersContainer" class="cards-container">
                        ${createCardsHTML(filteredData)}
                    </div>
                `;

                // Adiciona evento de clique ao botão Buscar
                const buscarButton = document.getElementById('buscarButton');
                if (buscarButton) {
                    buscarButton.addEventListener('click', filterUsers);
                }

                // Adiciona evento de clique ao botão Mostrar/Ocultar Inativos
                const toggleInactiveButton = document.getElementById('toggleInactiveButton');
                if (toggleInactiveButton) {
                    toggleInactiveButton.addEventListener('click', () => {
                        showInactiveUsers = !showInactiveUsers;
                        loadUserResults(); // Recarrega os usuários para aplicar o filtro
                    });
                }
            } else {
                console.error('Elemento center-panel não encontrado.');
            }
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

// Excluir um usuário
function deleteUser(usuarioId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        fetch(`/api/usuarios/${usuarioId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                alert('Usuário excluído com sucesso!');
                loadUserResults(); // Recarrega os resultados para refletir a exclusão
            } else {
                alert('Erro ao excluir usuário.');
            }
        })
        .catch(error => {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário.');
        });
    }
}


