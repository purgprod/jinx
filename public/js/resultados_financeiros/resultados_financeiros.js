let financialDataMap = {}; // Objeto para armazenar os dados localmente
let showInactive = false; // Mantém false para garantir que inativos não sejam exibidos por padrão

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

            // Função para filtrar dados ativos
            const filterData = () => {
                return data.filter(result => showInactive || result.status_ativo === 1);
            };

            // Função para criar o HTML dos cards
            const createCardsHTML = (filteredData) => {
                return filteredData.map(result => `
                    <div class="card" data-id="${result.id_resultado}">
                        <span class="card-id">#${result.id_resultado}</span>
                        <h3 class="card-title">${result.razao_social}</h3>
			<p><strong>Risco:</strong> ${result.risco}</p>
                        <p><strong>Valor Financiamento:</strong> R$ ${parseFloat(result.valor_financiamento_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Retorno a.a:</strong> ${parseFloat(result.juros_a_a).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%</p>
                        <p><strong>Resultado Financeiro:</strong> R$ ${parseFloat(result.resultado_financeiro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Vencimento:</strong> ${new Date(result.vencimento).toLocaleDateString('pt-BR')}</p>
			<p><strong>CNPJ:</strong> ${result.cnpj}</p>
                        <p><strong>Site:</strong> <a href="https://${result.site}" target="_blank">${result.site}</a></p>
                        <p><strong>Instagram:</strong> <a href="https://${result.instagram}" target="_blank">${result.instagram}</a></p>
                        ${result.status_ativo === 0 ? `<p class="inactive-label" style="color: red;"><strong>Inativo</strong></p>` : ''} <!-- Texto para inativos -->
                    </div>
                `).join('');
            };

            // Atualiza o conteúdo do painel central
            const centerPanel = document.querySelector('.center-panel');
            if (centerPanel) {
                const filteredData = filterData();
                centerPanel.innerHTML = `
		    <h2>Resultados Financeiros</h2>
		    <div class="button-container">
                        <button id="novoButton" class="button-azul">Criar Novo Resultado</button>
                        <button id="inativosButton" class="button-vermelho">${showInactive ? "Ocultar Resultados Inativos" : "Mostrar Resultados Inativos"}</button>
                    </div>
                    <div id="cardsContainer" class="cards-container">
                        ${createCardsHTML(filteredData)}
                    </div>
                `;

                // Adiciona evento de clique a cada card
                document.querySelectorAll('.card').forEach(card => {
                    card.addEventListener('click', () => {
                        const idResultado = card.getAttribute('data-id');
                        loadFinancialDetails(idResultado);
                    });
                });

                // Adiciona evento de clique ao botão Novo
                const novoButton = document.getElementById('novoButton');
                if (novoButton) {
                    novoButton.addEventListener('click', () => {
                        import('./resultados_financeiros_novo.js')
                            .then(module => {
                                module.loadNewFinancialDetails();
                            })
                            .catch(error => {
                                console.error('Erro ao carregar o módulo:', error);
                            });
                    });
                }

                // Adiciona evento de clique ao botão Mostrar/Ocultar Inativos
                const inativosButton = document.getElementById('inativosButton');
                if (inativosButton) {
                    inativosButton.addEventListener('click', () => {
                        showInactive = !showInactive;
                        loadFinancialResults(); // Recarrega os resultados para aplicar o filtro
                    });
                }
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

// Chama a função ao carregar a página para garantir que apenas os ativos sejam exibidos inicialmente
window.addEventListener('load', loadFinancialResults);

