// public/js/tokens/tokens_detalhes.js
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadTokensDetails(idToken) {
    const data = tokensDataMap[idToken];
    if (data) {
        const centerPanel = document.querySelector('.center-panel');
        if (centerPanel) {
            centerPanel.innerHTML = `
                <h2>Detalhes do Token ${data.razao_social}</h2>
                <form id="financialDetailsForm">
                    ${generateTokensInputFields(data)}
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
            `;
            setupEventListenersTokens(idToken);
        } else {
            console.error('Elemento center-panel não encontrado.');
        }
    } else {
        console.error('Dados não encontrados para o ID:', idToken);
    }
}

function generateTokensInputFields(data) {
    return `
        <label for="razao_social">Razão Social:</label>
        <input type="text" id="razao_social" name="razao_social" value="${data.razao_social}" readonly>

        <label for="risco">Risco:</label>
        <input type="text" id="risco" name="risco" value="${data.risco}" readonly>

        <label for="data_criacao">Data de Criação:</label>
        <input type="text" id="data_criacao" name="data_criacao" value="${formatDate(data.data_criacao)}" readonly>

        <label for="quantidade_tokens">Quantidade Total de Tokens:</label>
        <input type="number" step="0.01" id="quantidade_tokens" name="quantidade_tokens" value="${parseFloat(data.quantidade_tokens).toLocaleString('pt-BR')}" readonly>

        <label for="valor_token">Valor do Token:</label>
        <input type="number" step="0.00000001" id="valor_token" name="valor_token" value="${parseFloat(data.valor_token).toFixed(8)}" readonly>

        <label for="rendimento_token">Rendimento por Token:</label>
        <input type="number" step="0.00000001" id="rendimento_token" name="rendimento_token" value="${parseFloat(data.rendimento_token).toFixed(8)}" readonly>

        <label for="vencimento">Vencimento:</label>
        <input type="date" id="vencimento" name="vencimento" value="${formatDate(data.vencimento)}" readonly>

        <label for="dias_vencimento">Dias para o Vencimento:</label>
        <input type="dias_vencimento" id="dias_vencimento" name="dias_vencimento" value="${data.dias_vencimento}" readonly>

        <label for="flag_sinistro">Flag Sinistro:</label>
        <input type="number" id="flag_sinistro" name="flag_sinistro" value="${data.flag_sinistro}" readonly>

        <label for="data_sinistro">Data Sinistro:</label>
        <input type="date" id="data_sinistro" name="data_sinistro" value="${formatDate(data.data_sinistro)}" readonly>

        <label for="status_ativo">Status Ativo:</label>
        <input type="number" id="status_ativo" name="status_ativo" value="${data.status_ativo}" readonly>
    `;
}

function setupEventListenersTokens(idToken) {
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
            
            // Atualiza valores vazios para null
            for (let key in updatedData) {
                if (updatedData[key] === '') {
                    updatedData[key] = null;
                }
            }

            console.log('Dados do formulário a serem enviados:', updatedData);

            fetch(`/api/tokens/${idToken}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            })
            .then(response => {
                if (response.ok) {
                    alert('Token atualizado com sucesso!');
                    refreshPage();
                    return response.json();
                } else {
                    return response.json().then(data => Promise.reject(data));
                }
            })
            .catch(error => {
                console.error('Erro ao atualizar o token:', error);
                alert(`Erro ao atualizar o token: ${error.message || 'Erro inesperado'}`);
            });
        });
    } else {
        console.error('Formulário não encontrado.');
    }

    setupToggleActivationTokensButton(idToken, 'ativar', 'ativar');
    setupToggleActivationTokensButton(idToken, 'inativar', 'inativar');
}

function refreshPage() {
    location.reload();
}

function setupToggleActivationTokensButton(idToken, buttonId, action) {
    const button = document.getElementById(buttonId + 'Button');
    if (button) {
        button.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja ${action} este token?`)) {
                fetch(`/api/tokens/${idToken}/${action}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                })
                .then(response => {
                    if (response.ok) {
                        alert(`Token ${action} com sucesso!`);
                        refreshPage();
                    } else {
                        return response.json().then(data => Promise.reject(data));
                    }
                })
                .catch(error => {
                    console.error(`Erro ao ${action} o token:`, error);
                    alert(`Erro ao ${action} o token: ${error.message || 'Erro inesperado'}`);
                });
            }
        });
    }
}

