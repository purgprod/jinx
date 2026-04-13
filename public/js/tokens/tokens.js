let pinsDataMap = {}; // Objeto para armazenar os dados localmente
let showInactivePins = false; // Por padrão, pins inativos não são exibidos

// Função para formatar datas no formato dd-MM-yyyy
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

function loadPinsResults() {
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

            // Armazena os dados dos pins para acesso rápido
            data.forEach(result => {
                pinsDataMap[result.id_resultado] = result;
            });

            // Exibe o painel de pins
            showPinCards();

            // Carrega os pins no HTML
            filterPins(); // Filtra e exibe pins baseando-se no status (ativo/inativo)
        })
        .catch(error => {
            console.error("Erro ao buscar pins:", error);
        });
}

// Função para mostrar os cartões de pins e botões de controle
function showPinCards() {
    const centerPanel = document.querySelector('.center-panel');
    if (centerPanel) {
        centerPanel.innerHTML = `
            <h2 class="page-title">Pins</h2>
            <div class="button-container">
                <button id="inativosButton" class="button-vermelho">${showInactivePins ? "Ocultar Pins Ativos" : "Mostrar Pins Inativos"}</button>
            </div>
            <div id="cardsContainer" class="cards-container"></div>
            <h2>Sanitização do Ambiente</h2>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Vender todos os Pins dos clientes</strong></p>
                        <p>Remove todas as posições de Pins (exceto Emblemas) de todos os clientes, devolvendo o saldo investido.</p>
                        <div class="button-container">
                            <button type="button" id="venderTodosPinsButton" class="button-vermelho">Vender Todos os Pins</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        addPinButtonEventListeners();
    }
}

// Função para adicionar eventos de clique aos botões de controle de pins
function addPinButtonEventListeners() {
    const inativosButton = document.getElementById('inativosButton');
    if (inativosButton) {
        inativosButton.addEventListener('click', () => {
            showInactivePins = !showInactivePins;
            filterPins(); // Atualiza a exibição dos pins conforme o tipo selecionado
        });
    }

    const venderTodosPinsButton = document.getElementById('venderTodosPinsButton');
    if (venderTodosPinsButton) {
        venderTodosPinsButton.addEventListener('click', () => {
            const confirmado = confirm(
                'ATENÇÃO: Esta ação irá vender TODOS os Pins de TODOS os clientes.\n\n' +
                'Esta operação é irreversível. Deseja continuar?'
            );
            if (!confirmado) return;

            venderTodosPinsButton.disabled = true;
            venderTodosPinsButton.textContent = 'Processando...';

            fetch('/api/rotinas/vender-todos-pins', { method: 'PUT' })
                .then(response => response.json().then(data => ({ ok: response.ok, data })))
                .then(({ ok, data }) => {
                    if (ok) {
                        alert(`Operação concluída com sucesso!\n${data.mensagem || ''}`);
                        window.location.reload();
                    } else {
                        alert(`Erro: ${data.mensagem || 'Falha ao executar a operação.'}`);
                        venderTodosPinsButton.disabled = false;
                        venderTodosPinsButton.textContent = 'Vender Todos os Pins';
                    }
                })
                .catch(error => {
                    console.error('Erro ao vender todos os pins:', error);
                    alert('Erro de comunicação ao tentar vender os pins.');
                    venderTodosPinsButton.disabled = false;
                    venderTodosPinsButton.textContent = 'Vender Todos os Pins';
                });
        });
    }
}

// Filtra e exibe pins de acordo com o estado ativo/inativo
function filterPins() {
    let filteredPins = Object.values(pinsDataMap).filter(pin => showInactivePins || pin.status_ativo === 1);

    const cardsContainer = document.getElementById('cardsContainer');
    if (cardsContainer) {
        cardsContainer.innerHTML = createPinCardsHTML(filteredPins);
        addPinCardEventListeners();
    }
}

function createPinCardsHTML(pins) {
    return pins.map(pin => `
        <div class="card" data-id="${pin.id_resultado}">
            <span class="card-id">#${pin.id_token}</span>
            <h3 class="card-title">${pin.razao_social}</h3>
            <p><strong>Risco:</strong> ${pin.risco}</p>
            <p><strong>Vencimento:</strong> ${formatDate(pin.vencimento)}</p>
            <p><strong>Quantidade Pins:</strong> ${parseFloat(pin.quantidade_tokens).toLocaleString('pt-BR')}</p>
            <p><strong>Valor Pin:</strong> R$ ${parseFloat(pin.valor_token).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Rendimento Pin:</strong> R$ ${parseFloat(pin.rendimento_token).toLocaleString('pt-BR', { minimumFractionDigits: 8 })}</p>
            <p><strong>Flag Sinistro:</strong> ${pin.flag_sinistro}</p>
            ${pin.status_ativo === 0 ? `<p class="inactive-label" style="color: red;"><strong>Inativo</strong></p>` : ''}
        </div>
    `).join('');
}

function addPinCardEventListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const idResultado = card.getAttribute('data-id');
            loadPinsDetails(idResultado);
        });
    });
}

// Torna a função acessível no escopo global
window.loadPinsResults = loadPinsResults;

// Inicializa a exibição de resultados ao carregar a página
document.addEventListener("DOMContentLoaded", loadPinsResults);

