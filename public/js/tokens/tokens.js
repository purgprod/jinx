let tokensDataMap = {}; // Objeto para armazenar os dados localmente

// Função para formatar datas no formato dd-MM-yyyy
function formatDate(dateString) {
    if (!dateString) return ''; // Retorna uma string vazia se a data for null ou undefined
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Adiciona zero à esquerda se necessário
    const day = String(date.getDate()).padStart(2, '0'); // Adiciona zero à esquerda se necessário
    return `${day}/${month}/${year}`;
}

function loadTokensResults() {
    console.log("Iniciando chamada para '/api/tokens'");

    fetch('/api/tokens')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na resposta: ${response.status}`);
            }
            return response.json(); // Processa a resposta como JSON
        })
        .then(data => {
            console.log("Dados recebidos do servidor:", data);

            // Armazena os dados em um mapa para acesso rápido
            data.forEach(result => {
                tokensDataMap[result.id_resultado] = result;
            });

            // Mapeia os resultados financeiros para exibição em forma de cards
            const tokensResults = data.map(result => `
                <div class="card" data-id="${result.id_resultado}">
                    <h3 class="card-title">${result.razao_social}</h3>
                    <p><strong>Vencimento:</strong> ${formatDate(result.vencimento)}</p>
                    <p><strong>Valor Token:</strong> R$ ${parseFloat(result.valor_token).toLocaleString('pt-BR', { minimumFractionDigits: 8 })}</p>
                    <p><strong>Quantidade Tokens:</strong> ${parseFloat(result.quantidade_tokens).toLocaleString('pt-BR')}</p>
                    <p><strong>Rendimento Token:</strong> R$ ${parseFloat(result.rendimento_token).toLocaleString('pt-BR', { minimumFractionDigits: 8 })}</p>
                    <p><strong>Risco:</strong> ${result.risco}</p>
                    <p><strong>Flag Sinistro:</strong> ${result.flag_sinistro}</p>
                </div>
            `).join('');

            // Atualiza o conteúdo do painel central
            const centerPanel = document.querySelector('.center-panel');
            if (centerPanel) {
                centerPanel.innerHTML = `
                    <h2 class="bets-title">Tokens</h2>
                    <div id="cardsContainer" class="cards-container">
                        ${tokensResults}
                    </div>
                `;

                // Adiciona evento de clique a cada card
                document.querySelectorAll('.card').forEach(card => {
                    card.addEventListener('click', () => {
                        const idResultado = card.getAttribute('data-id');
                        loadTokensDetails(idResultado);
                    });
                });

            } else {
                console.error('Elemento center-panel não encontrado.');
            }
        })
        .catch(error => {
            console.error("Erro ao buscar tokens:", error);
        });
}

// Torna a função acessível no escopo global
window.loadTokensResults = loadTokensResults;

