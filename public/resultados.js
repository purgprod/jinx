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

            // Mapeia os resultados financeiros para exibição em forma de cards
            const financialResults = data.map(result => `
                <div class="card">
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
            const centerPanel = document.getElementById('cardsContainer');
            centerPanel.innerHTML = `
                <div class="cards-container">
                    ${financialResults}
                </div>
            `;
        })
        .catch(error => {
            console.error("Erro ao buscar resultados financeiros:", error);
        });
}

// Torna a função acessível no escopo global
window.loadFinancialResults = loadFinancialResults;

