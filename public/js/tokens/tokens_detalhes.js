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
                    <h2>Detalhes do Pin ${data.razao_social}</h2>
                    <form id="financialDetailsForm">
                        ${generateTokensInputFields(data)}
                        <div class="button-container">
                            <button type="button" id="editButton" class="button-azul">Editar</button>
                            <button type="submit" id="saveButton" class="button-azul">Salvar</button>
                          <!--  ${data.status_ativo === 0 
                                ? `<button type="button" id="ativarButton" class="button-verde">Ativar</button>`
                                : `<button type="button" id="inativarButton" class="button-vermelho">Inativar</button>`} -->
                        </div>
                    </form>
                    <h3>Distribuição do Token</h3>
                    <div id="chartsContainer">
                        <canvas id="freeFloatChart" width="400" height="400"></canvas>
                        <canvas id="percentageChart" width="400" height="400"></canvas>
                    </div>
		    <br>
                    <h3>Consumo do Free Float</h3>
                    <canvas id="historicoFreeFloatChart" width="400" height="400"></canvas>
                `;
                showFreeFloatPieChart(freeFloatData);
                showPercentagePieChart(freeFloatData);
                loadFreeFloatHistoricos(idToken);
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

//    const totalTokens = freeFloatData[0].quantidade_tokens;
    const freeFloat = freeFloatData[0].freefloat_token;
    const ipo = freeFloatData[0].quantidade_tokens;

    const ctx = document.getElementById('freeFloatChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [`Purg IPO`, `Free Float`],
            datasets: [{
                data: [ipo, freeFloat],
                backgroundColor: ['#36A2EB', '#64CE68'],
                borderColor: ['#36A2EB', '#64CE68'],
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

    const freeFloat = freeFloatData[0].freefloat_token;
    const ipo = freeFloatData[0].quantidade_tokens;
    const totalTokens = ( ipo + freeFloat);

    const percentageIPO = ((ipo / totalTokens) * 100).toFixed(2);
    const percentageAvailable = ((freeFloat / totalTokens) * 100).toFixed(2);

    const ctx = document.getElementById('percentageChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [`Purg IPO`, `Free Float`],
            datasets: [{
                data: [percentageIPO, percentageAvailable],
                backgroundColor: ['#36A2EB', '#64CE68'],
                borderColor: ['#36A2EB', '#64C368'],
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

function loadFreeFloatHistoricos(tokenId) {
    return fetch(`/api/tokens/${tokenId}/free-float-historicos`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados de free float históricos');
            }
            return response.json();
        })
        .then(dados => {
            console.log('Dados de free float históricos:', dados);
            renderizarGraficoFreeFloatHistorico(dados);
        })
        .catch(error => {
            console.error('Erro ao carregar dados de free float históricos:', error);
        });
}

let historicoChart;

function renderizarGraficoFreeFloatHistorico(dados) {
    const canvas = document.getElementById('historicoFreeFloatChart');
    if (!canvas) {
        console.error('Elemento canvas "historicoFreeFloatChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (historicoChart) {
        historicoChart.destroy();
    }

    const labels = dados.map(d => new Date(d.data).toLocaleDateString());
    const tokenIpoValues = dados.map(d => d.token_ipo);
    const tokenFreeFloatValues = dados.map(d => d.token_freefloat);

    historicoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Purg IPO',
                    data: tokenIpoValues,
                    borderColor: '#36A2EB',
                    fill: false,
                },
                {
                    label: 'Free Float',
                    data: tokenFreeFloatValues,
                    borderColor: '#64CE68',
                    fill: false,
                }
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Histórico de consumo do token',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantidade de Tokens'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data'
                    }
                }
            }
        }
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


