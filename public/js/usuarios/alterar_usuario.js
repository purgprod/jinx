// Função para carregar a interface de alteração do usuário
function loadAlterUserInterface() {
    const centralPanel = document.querySelector('.center-panel');

    if (centralPanel) {
        centralPanel.innerHTML = `
            <div class="form-container">
                <h2>Alterar Usuário</h2>
                <input type="email" id="emailParaAlterar" placeholder="E-mail do Usuário" required />
                <button class="button-novo" onclick="fetchUserData()">Buscar Usuário</button>
                <button class="button-novo" onclick="showUserCards()">Voltar</button> <!-- Botão para voltar -->
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
        // Adiciona as informações do usuário e o botão de exclusão diretamente aqui
        displayUserInfo(userData); // Chama a função para exibir as informações do usuário
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
                <button class="button-novo" onclick="deleteUser('${userData.usuario_id}')">Excluir Usuário</button> <!-- Botão Excluir -->
            </div>
        `;
    }
}

// Função para excluir um usuário
function deleteUser(usuarioId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        fetch(`/api/usuarios/${usuarioId}`, { // URL onde sua API espera a requisição para excluir
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                alert('Usuário excluído com sucesso!'); // Mensagem de sucesso
                showUserCards(); // Volta para a tela inicial após excluir
            } else {
                alert('Erro ao excluir usuário.'); // Mensagem de erro
            }
        })
        .catch(error => {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário.'); // Mensagem de erro
        });
    }
}

// Removido: Não chame mais a função no DOMContentLoaded
// document.addEventListener("DOMContentLoaded", loadAlterUserInterface); // Esta linha foi removida
