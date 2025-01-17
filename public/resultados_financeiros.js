let financialDataMap = {}; // Objeto para armazenar os dados localmente

function loadFinancialResults() {
    console.log("Iniciando chamada para '/api/resultados-financeiros'");

    fetch('/api/resultados-financeiros')
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
                financialDataMap[result.id_resultado] = result;
            });

            // Mapeia os resultados financeiros para exibição em forma de cards
            const financialResults = data.map(result => `
                <div class="card" data-id="${result.id_resultado}">
                    <h3 class="card-title">${result.razao_social}</h3>
                    <p><strong>CNPJ:</strong> ${result.cnpj}</p>
                    <p><strong>Valor Financiamento:</strong> R$ ${parseFloat(result.valor_financiamento_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Retorno a.a:</strong> ${parseFloat(result.juros_a_a).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%</p>
                    <p><strong>Resultado Financeiro:</strong> R$ ${parseFloat(result.resultado_financeiro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Risco:</strong> ${result.risco}</p>
                    <p><strong>Vencimento:</strong> ${new Date(result.vencimento).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Site:</strong> <a href="https://${result.site}" target="_blank">${result.site}</a></p>
                    <p><strong>Instagram:</strong> <a href="https://${result.instagram}" target="_blank">${result.instagram}</a></p>
                </div>
            `).join('');

            // Atualiza o conteúdo do painel central
            const centerPanel = document.querySelector('.center-panel');
            if (centerPanel) {
                centerPanel.innerHTML = `
                    <h2 class="bets-title">Resultados Financeiros</h2>
                    <div id="cardsContainer" class="cards-container">
                        ${financialResults}
                    </div>
                `;

                // Adiciona evento de clique a cada card
                document.querySelectorAll('.card').forEach(card => {
                    card.addEventListener('click', () => {
                        const idResultado = card.getAttribute('data-id');
                        loadFinancialDetails(idResultado);
                    });
                });
            } else {
                console.error('Elemento center-panel não encontrado.');
            }
        })
        .catch(error => {
            console.error("Erro ao buscar resultados financeiros:", error);
        });
}

// Torna a função acessível no escopo global
window.loadFinancialResults = loadFinancialResults;

