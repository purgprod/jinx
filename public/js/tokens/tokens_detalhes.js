function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

async function fetchFreeFloatData(idToken) {
    try {
        const response = await fetch(`/api/tokens/free-float/${idToken}`);
        if (!response.ok) throw new Error('Erro ao buscar dados de free float.');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar free float token:', error);
        return [];
    }
}

function loadTokensDetails(idToken) {
    const data = tokensDataMap[idToken];
    if (data) {
        fetchFreeFloatData(idToken).then(freeFloatData => {
            if (!freeFloatData.length) {
                console.error('Dado de free float não encontrado para este token.');
                return;
            }
            const centerPanel = document.querySelector('.center-panel');
            if (centerPanel) {
                centerPanel.innerHTML = `
                    <h2>Detalhes do Token ${data.razao_social}</h2>
                    <form id="financialDetailsForm">
                        ${generateTokensInputFields(data)}
                        <div class="button-container">
                            <button type="button" id="editButton" class="button-azul">Editar</button>
                            <button type="submit" id="saveButton" class="button-azul">Salvar</button>
                            ${data.status_ativo === 0 
                                ? `<button type="button" id="ativarButton" class="button-verde">Ativar</button>` 
                                : `<button type="button" id="inativarButton" class="button-vermelho">Inativar</button>`}
                        </div>
                    </form>
                    <h3>Distribuição do Token</h3>
                    <div id="chartsContainer">
                        <canvas id="freeFloatChart" width="400" height="400"></canvas>
                        <canvas id="percentageChart" width="400" height="400"></canvas>
                    </div>
                `;
                showFreeFloatPieChart(freeFloatData);
                showPercentagePieChart(freeFloatData);
                setupEventListenersTokens(idToken);
            } else {
                console.error('Elemento center-panel não encontrado.');
            }
        }).catch(error => {
            console.error('Erro ao carregar detalhes do token:', error);
        });
    } else {
        console.error('Dados não encontrados para o ID:', idToken);
    }
}

function showFreeFloatPieChart(freeFloatData) {
    if (!freeFloatData.length) {
        console.error('Nenhum dado de free float disponível.');
        return;
    }

    const totalTokens = freeFloatData[0].quantidade_tokens;
    const freeFloat = freeFloatData[0].freefloat_token;
    const consumed = totalTokens - freeFloat;

    const ctx = document.getElementById('freeFloatChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
		labels: [`Free Float`, `Purg IPO`],
            datasets: [{
                data: [freeFloat, consumed],
                backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
                borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
		legend: { 
			position: 'top', 
			labels: { font: { size: 17 }}
		},
                title: { display: true, text: 'Purg IPO x Free Float', font: { size: 17 }},
                datalabels: {
                    color: '#000',
		    font: { size: 17 },
                    formatter: (value, ctx) => {
                       // return `${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;    
                        return `${value.toLocaleString('pt-BR')}`;    
		       }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function showPercentagePieChart(freeFloatData) {
    if (!freeFloatData.length) {
        console.error('Nenhum dado de free float disponível para porcentagem.');
        return;
    }

    const totalTokens = freeFloatData[0].quantidade_tokens;
    const freeFloat = freeFloatData[0].freefloat_token;
    const consumed = totalTokens - freeFloat;

    const percentageConsumed = ((consumed / totalTokens) * 100).toFixed(2);
    const percentageAvailable = ((freeFloat / totalTokens) * 100).toFixed(2);

    const ctx = document.getElementById('percentageChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [`Free Float`, `Purg IPO`],
            datasets: [{
                data: [percentageAvailable, percentageConsumed],
                backgroundColor: ['rgba(255, 206, 86, 0.5)', 'rgba(160, 212, 124, 0.5)'],
                borderColor: ['rgba(255, 206, 86, 1)', 'rgba(160, 212, 124, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
			position: 'top',  
			labels: {font: { size: 17 }}
			},
                title: { display: true, text: 'Porcentagem de Purg IPO x Free Float', font: { size: 17 }},
                datalabels: {
                    color: '#000',
		    font: { size: 17 }, 
                    formatter: (value) => {
                        const numericValue = parseFloat(value);
                        return isNaN(numericValue) ? '0%' : `${numericValue.toFixed(2)}%`;
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function generateTokensInputFields(data) {
    return `
        <label for="razao_social">Razão Social:</label>
        <input type="text" id="razao_social" name="razao_social" value="${data.razao_social}" readonly>
        <label for="risco">Risco:</label>
        <input type="text" id="risco" name="risco" value="${data.risco}" readonly>
        <label for="quantidade_tokens">Quantidade Total de Tokens:</label>
        <input type="number" id="quantidade_tokens" name="quantidade_tokens" value="${data.quantidade_tokens}" readonly>
        <label for="valor_token">Valor do Token:</label>
        <input type="text" id="valor_token" name="valor_token" value="R$ ${parseFloat(data.valor_token).toFixed(2)}" readonly>
        <label for="rendimento_token">Rendimento por Token:</label>
        <input type="text" id="rendimento_token" name="rendimento_token" value="R$ ${parseFloat(data.rendimento_token).toFixed(8)}" readonly>
    `;
}

function setupEventListenersTokens(idToken) {
    document.getElementById('editButton').addEventListener('click', () => {
        document.querySelectorAll('#financialDetailsForm input').forEach(el => el.removeAttribute('readonly'));
    });

    document.getElementById('financialDetailsForm').addEventListener('submit', (event) => {
        event.preventDefault();
        alert('Implementar lógica de atualização aqui.');
    });
}

window.loadTokensDetails = loadTokensDetails;

