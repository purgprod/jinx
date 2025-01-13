// usuarios.js

function loadUsers() {
    const centerPanel = document.getElementById('cardsContainer');
    centerPanel.innerHTML = ''; // Limpa o conteúdo atual

    // Aqui você pode adicionar as informações que deseja exibir
    const usersInfo = `
        <div>
            <h3>Lista de Usuários</h3>
            <ul>
                <li>Usuário 1</li>
                <li>Usuário 2</li>
                <li>Usuário 3</li>
            </ul>
        </div>
    `;
    
    // Adiciona o novo conteúdo ao painel central
    centerPanel.innerHTML = usersInfo;
}

