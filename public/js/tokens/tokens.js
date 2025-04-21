let tokensDataMap = {}; // Objeto para armazenar os dados localmente
let showInactiveTokens = false; // Por padrão, tokens inativos não são exibidos

// Função para formatar datas no formato dd-MM-yyyy
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

function loadTokensResults() {
    console.log("Iniciando chamada para '/api/tokens'");

    fetch('/api/tokens')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na resposta: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados recebidos do servidor:", data);

            // Armazena os dados dos tokens para acesso rápido
            data.forEach(result => {
                tokensDataMap[result.id_resultado] = result;
            });

            // Exibe o painel de tokens
            showTokenCards();

            // Carrega os tokens no HTML
            filterTokens(); // Filtra e exibe tokens baseando-se no status (ativo/inativo)
        })
        .catch(error => {
            console.error("Erro ao buscar tokens:", error);
        });
}

// Função para mostrar os cartões de tokens e botões de controle
function showTokenCards() {
    const centerPanel = document.querySelector('.center-panel');
    if (centerPanel) {
        centerPanel.innerHTML = `
            <h2 class="page-title">Pins</h2>
            <div class="button-container">
                <button id="inativosButton" class="button-vermelho">${showInactiveTokens ? "Ocultar Pins Ativos" : "Mostrar Pins Inativos"}</button>
            </div>
            <div id="cardsContainer" class="cards-container"></div>
        `;

        addTokenButtonEventListeners();
    }
}

// Função para adicionar eventos de clique aos botões de controle de tokens
function addTokenButtonEventListeners() {
    const inativosButton = document.getElementById('inativosButton');
    if (inativosButton) {
        inativosButton.addEventListener('click', () => {
            showInactiveTokens = !showInactiveTokens;
            filterTokens(); // Atualiza a exibição dos tokens conforme o tipo selecionado
        });
    }
}

// Filtra e exibe tokens de acordo com o estado ativo/inativo
function filterTokens() {
    let filteredTokens = Object.values(tokensDataMap).filter(token => showInactiveTokens || token.status_ativo === 1);

    const cardsContainer = document.getElementById('cardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = createTokenCardsHTML(filteredTokens);
        addTokenCardEventListeners();
    }
}

function createTokenCardsHTML(tokens) {
    return tokens.map(token => `
        <div class="card" data-id="${token.id_resultado}">
            <h3 class="card-title">${token.razao_social}</h3>
            <p><strong>Risco:</strong> ${token.risco}</p>
            <p><strong>Vencimento:</strong> ${formatDate(token.vencimento)}</p>
            <p><strong>Quantidade Tokens:</strong> ${parseFloat(token.quantidade_tokens).toLocaleString('pt-BR')}</p>
            <p><strong>Valor Token:</strong> R$ ${parseFloat(token.valor_token).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Rendimento Token:</strong> R$ ${parseFloat(token.rendimento_token).toLocaleString('pt-BR', { minimumFractionDigits: 8 })}</p>
            <p><strong>Flag Sinistro:</strong> ${token.flag_sinistro}</p>
            ${token.status_ativo === 0 ? `<p class="inactive-label" style="color: red;"><strong>Inativo</strong></p>` : ''}
        </div>
    `).join('');
}

function addTokenCardEventListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const idResultado = card.getAttribute('data-id');
            loadTokensDetails(idResultado);
        });
    });
}

// Torna a função acessível no escopo global
window.loadTokensResults = loadTokensResults;

// Inicializa a exibição de resultados ao carregar a página
document.addEventListener("DOMContentLoaded", loadTokensResults);

