function loadUserDetails(usuario_id) {
    const data = userDataMap[usuario_id];
    if (data) {
        const centerPanel = document.querySelector('.center-panel');
        if (centerPanel) {
            centerPanel.innerHTML = `
                <h2>Detalhes do usuário ${data.nome}</h2>
                <form id="financialDetailsForm">
                    ${generateUserInputFields(data)}
                    <div class="button-container">
                        <button type="button" id="editButton" class="button-azul">Editar</button>
                        <button type="submit" id="saveButton" class="button-azul">Salvar</button>
                        ${data.status_ativo === 0 ? `
                            <button type="button" id="ativarButton" class="button-verde">Ativar</button>
                        ` : `
                            <button type="button" id="inativarButton" class="button-vermelho">Inativar</button>
                        `}
                    </div>
                </form>
                <h3>Tokens do Usuário</h3>
                <div id="tokensContainer" class="cards-container"></div>
            `;
            setupEventListeners(usuario_id);
            loadUserTokens(usuario_id); // Carrega e exibe os tokens
        } else {
            console.error('Elemento center-panel não encontrado.');
        }
    } else {
        console.error('Dados não encontrados para o ID:', usuario_id);
    }
}

// Função que busca e exibe os tokens do usuário
function loadUserTokens(usuario_id) {
    fetch(`/api/usuarios/${usuario_id}/tokens`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar tokens');
            }
            return response.json();
        })
        .then(tokens => {
            const tokensContainer = document.getElementById('tokensContainer');
            if (tokensContainer) {
                tokensContainer.innerHTML = tokens.map(createTokenCardHTML).join('');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar tokens do usuário:', error);
        });
}

// Função para gerar o HTML para um cartão de token
function createTokenCardHTML(token) {
    return `
        <div class="card">
            <h4>${token.razao_social}</h4>
            <p><strong>Risco:</strong> ${token.risco}</p>
            <p><strong>Quantidade de Tokens:</strong> ${token.quantidade_tokens}</p>
	    <p><strong>Valor do Token:</strong> ${token.valor_token}</p>
            <p><strong>Rendimento do Token:</strong> ${token.rendimento_token}</p>
            <p><strong>Vencimento:</strong> ${formatDate(token.vencimento)}</p>
            <p><strong>Dias para Vencimento:</strong> ${token.dias_vencimento}</p>
        </div>
    `;
}

// Função que gera HTML para os campos de entrada baseado nos dados do usuário
function generateUserInputFields(data) {
    return `
        <label for="email">E-mail:</label>
        <input type="text" id="email" name="email" value="${data.email ?? ''}" readonly>

        <label for="data_criacao">Data de Criação:</label>
        <input type="date" id="created_at" name="created_at" value="${data.created_at ? formatDate(data.created_at) : ''}" readonly>

        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" value="${data.nome ?? ''}" readonly>

        <label for="data_ultima_alteracao">Última Alteração:</label>
        <input type="date" id="data_ultima_alteracao" name="data_ultima_alteracao" value="${data.data_ultima_alteracao ? formatDate(data.data_ultima_alteracao) : ''}" readonly>
    `;
}

function setupEventListeners(usuario_id) {
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.addEventListener('click', () => {
            document.querySelectorAll('#financialDetailsForm input, #financialDetailsForm textarea').forEach(element => {
                element.removeAttribute('readonly');
            });
        });
    } else {
        console.error('Botão Editar não encontrado.');
    }

    const form = document.getElementById('financialDetailsForm');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const updatedData = Object.fromEntries(formData.entries());
            
            for (let key in updatedData) {
                if (updatedData[key] === '') {
                    updatedData[key] = null;
                }
            }

            console.log('Dados do formulário a serem enviados:', updatedData);

            fetch(`/api/usuarios/${usuario_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            })
            .then(response => {
                if (response.ok) {
                    alert('Dados atualizados com sucesso!');
                    refreshPage(); // Recarrega a página após a atualização
                } else {
                    return response.json().then(data => Promise.reject(data));
                }
            })
            .catch(error => {
                console.error('Erro ao atualizar os dados:', error);
                alert('Erro ao atualizar os dados.');
            });
        });
    } else {
        console.error('Formulário não encontrado.');
    }

    setupToggleActivationButton(usuario_id, 'ativar', 'ativar');
    setupToggleActivationButton(usuario_id, 'inativar', 'inativar');
}

// Função para recarregar a página
function refreshPage() {
    location.reload(); // Recarrega a página inteira
}

// Configura botão para ativar/inativar
function setupToggleActivationButton(usuario_id, buttonId, action) {
    const button = document.getElementById(buttonId + 'Button');
    if (button) {
        button.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja ${action} este usuário?`)) {
                fetch(`/api/usuarios/${usuario_id}/${action}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                })
                .then(response => {
                    if (response.ok) {
                        alert(`Usuário ${action} com sucesso!`);
                        refreshPage(); // Recarrega a página após a ativação/inativação
                    } else {
                        return response.json().then(data => Promise.reject(data));
                    }
                })
                .catch(error => {
                    console.error(`Erro ao ${action} o usuário:`, error);
                    alert(`Erro ao ${action} o usuário.`);
                });
            }
        });
    }
}

