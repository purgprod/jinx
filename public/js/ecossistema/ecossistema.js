let tokensData = [];
let tokensEcossistemaData = [];

// Função principal para carregar os resultados e ajustar o painel
function loadEcossistemaResults() {
    const usuario_id = 1;
    const data = userDataMap[usuario_id];
    
    if (data) {
        const centerPanel = document.querySelector('.center-panel');
        if (centerPanel) {
            centerPanel.innerHTML = `
                <h2>Purg x Usuários</h2>
                <div id="carteiraContainer" class="carteira-container">
                    <h3>Dados Financeiros</h3>
                    <div class="cards-basico">
                        <div class="card"><div class="card-content"><p><strong>Valor da Carteira (Purg):</strong> R$ <span id="valorCarteira">0,00</span></p></div></div>
                        <div class="card"><div class="card-content"><p><strong>Rendimento diário (Purg):</strong> R$ <span id="rendimentoDiario">0,00</span></p></div></div>
                        <div class="card"><div class="card-content"><p><strong>Total de Saques:</strong> R$ <span id="totalSaque">0,00</span></p></div></div>
                    </div>
                </div>
                <canvas id="carteiraChart" width="400" height="200"></canvas>
                <canvas id="carteiraRendimentosChart" width="400" height="200"></canvas>
                <h3>Distribuição da Carteira Purg</h3>
            	<div id="chartsContainer">    
			<canvas id="risksDistributionChart"></canvas>
                	<canvas id="risksPercentageChart"></canvas>
                	<canvas id="risksRendimentoChart"></canvas>
		</div>
                <h3>Distribuição da Carteira Ecossistema</h3>
            	<div id="chartsContainer">    
			<canvas id="risksDistributionEcossistemaChart"></canvas>
                	<canvas id="risksPercentageEcossistemaChart"></canvas>
                	<canvas id="risksRendimentoEcossistemaChart"></canvas>
		</div>
		
		<h3>Tokens da Purg</h3>
                <div id="tokensContainer" class="cards-container"></div>
            `;

            // Carregar dados
            Promise.all([
                loadUserTokens(usuario_id), 
                loadEcossistemaTokens(usuario_id), 
                loadUltimosDadosFinanceiros(usuario_id),
                loadDadosFinanceirosHistoricos(usuario_id), 
                loadDadosRendimentosHistoricos(usuario_id)
            ])
            .then(([tokens, tokensEcossistema, ultimosDados, dadosFinanceirosHistoricos, dadosRendimentosHistoricos]) => {
                return loadSaques(usuario_id).then(() => {
                    // Renderizar gráficos após o carregamento de dados
                    renderizarGraficoDistribuicaoRisco();
                    renderizarGraficoDistribuicaoRiscoEcossistema();
                    renderizarGraficoPorcentagemRisco();
                    renderizarGraficoPorcentagemRiscoEcossistema();
                    renderizarGraficoRendimentoPorRisco();
                    renderizarGraficoRendimentoPorRiscoEcossistema();
                    renderizarGrafico(dadosFinanceirosHistoricos);
                    renderizarGraficoRendimentos(dadosRendimentosHistoricos);
                });
            })
            .then(() => {
                console.log("Todas as chamadas de API foram completadas.");
            })
            .catch(err => {
                console.error("Erro ao carregar dados:", err);
            });
        } else {
            console.error('Elemento center-panel não encontrado.');
        }
    } else {
        console.error('Dados não encontrados para o ID:', usuario_id);
    }
}

function loadUserTokens(usuario_id) {
    return fetch(`/api/purg/${usuario_id}/tokens`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar tokens'))
        .then(tokens => {
            console.log("Tokens do usuário:", tokens);
            tokensData = tokens;
            const tokensContainer = document.getElementById('tokensContainer');
            if (tokensContainer) {
                tokensContainer.innerHTML = tokens.map(createTokenCardHTML).join('');
            }
        })
        .catch(error => console.error('Erro ao carregar tokens do usuário:', error));
}

function renderizarGraficoDistribuicaoRisco() {
    const canvas = document.getElementById('risksDistributionChart');
    if (!canvas) {
        console.error('Elemento canvas "risksDistributionChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const riscoMap = {};

    tokensData.forEach(token => {
        riscoMap[token.risco] = (riscoMap[token.risco] || 0) + token.quantidade_tokens * 0.01;
    });

    const labels = Object.keys(riscoMap);
    const data = Object.values(riscoMap).map(val => parseFloat(val.toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição Financeira de Risco dos Tokens (R$)',
                data: data,
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição Financeira de Risco dos Tokens (R$)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderizarGraficoPorcentagemRisco() {
    const canvas = document.getElementById('risksPercentageChart');
    if (!canvas) {
        console.error('Elemento canvas "risksPercentageChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const totalTokens = tokensData.reduce((sum, token) => sum + token.quantidade_tokens, 0);
    const riscoMap = {};

    tokensData.forEach(token => {
        riscoMap[token.risco] = (riscoMap[token.risco] || 0) + token.quantidade_tokens;
    });

    const labels = Object.keys(riscoMap);
    const data = Object.values(riscoMap).map(qtd => parseFloat(((qtd / totalTokens) * 100).toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição em Porcentagem de Risco dos Tokens (%)',
                data: data,
                backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição em Porcentagem de Risco dos Tokens (%)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => `${value.toFixed(2)}%`
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderizarGraficoRendimentoPorRisco() {
    const canvas = document.getElementById('risksRendimentoChart');
    if (!canvas) {
        console.error('Elemento canvas "risksRendimentoChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const riscoMap = {};

    tokensData.forEach(token => {
        const quantidade = token.quantidade_tokens || 0;
        const rendimento = token.rendimento_token || 0;
        riscoMap[token.risco] = (riscoMap[token.risco] || 0) + (quantidade * rendimento);
    });

    const labels = Object.keys(riscoMap);
    const data = Object.values(riscoMap).map(rend => parseFloat(rend.toFixed(8)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição do Rendimento Diário por Risco (R$)',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)', 
                    'rgba(54, 162, 235, 0.2)', 
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)', 
                    'rgba(54, 162, 235, 1)', 
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição do Rendimento Diário por Risco (R$)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}


function loadEcossistemaTokens(usuario_id) {
    return fetch(`/api/ecossistema/${usuario_id}/tokens`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar tokens'))
        .then(tokens => {
            console.log("Tokens do usuário:", tokens);
            tokensEcossistemaData = tokens;
            const tokensContainer = document.getElementById('tokensContainer');
            if (tokensContainer) {
                tokensContainer.innerHTML = tokens.map(createTokenCardHTML).join('');
            }
        })
        .catch(error => console.error('Erro ao carregar tokens do usuário:', error));
}

function renderizarGraficoDistribuicaoRiscoEcossistema() {
    const canvas = document.getElementById('risksDistributionEcossistemaChart');
    if (!canvas) {
        console.error('Elemento canvas "risksDistributionEcossistemaChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const riscoMap = {};

    tokensEcossistemaData.forEach(token => {
        riscoMap[token.risco] = (riscoMap[token.risco] || 0) + token.quantidade_tokens * 0.01;
    });

    const labels = Object.keys(riscoMap);
    const data = Object.values(riscoMap).map(val => parseFloat(val.toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição Financeira de Risco dos Tokens (R$)',
                data: data,
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição Financeira de Risco dos Tokens (R$)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderizarGraficoPorcentagemRiscoEcossistema() {
    const canvas = document.getElementById('risksPercentageEcossistemaChart');
    if (!canvas) {
        console.error('Elemento canvas "risksPercentageEcossistemaChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const totalTokens = tokensEcossistemaData.reduce((sum, token) => sum + token.quantidade_tokens, 0);
    const riscoMap = {};

    tokensEcossistemaData.forEach(token => {
        riscoMap[token.risco] = (riscoMap[token.risco] || 0) + token.quantidade_tokens;
    });

    const labels = Object.keys(riscoMap);
    const data = Object.values(riscoMap).map(qtd => parseFloat(((qtd / totalTokens) * 100).toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição em Porcentagem de Risco dos Tokens (%)',
                data: data,
                backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição em Porcentagem de Risco dos Tokens (%)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => `${value.toFixed(2)}%`
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderizarGraficoRendimentoPorRiscoEcossistema() {
    const canvas = document.getElementById('risksRendimentoEcossistemaChart');
    if (!canvas) {
        console.error('Elemento canvas "risksRendimentoEcossistemaChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const riscoMap = {};

    tokensEcossistemaData.forEach(token => {
        const quantidade = token.quantidade_tokens || 0;
        const rendimento = token.rendimento_token || 0;
        riscoMap[token.risco] = (riscoMap[token.risco] || 0) + (quantidade * rendimento);
    });

    const labels = Object.keys(riscoMap);
    const data = Object.values(riscoMap).map(rend => parseFloat(rend.toFixed(8)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição do Rendimento Diário por Risco (R$)',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)', 
                    'rgba(54, 162, 235, 0.2)', 
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)', 
                    'rgba(54, 162, 235, 1)', 
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição do Rendimento Diário por Risco (R$)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}


function loadUltimosDadosFinanceiros(usuario_id) {
    return fetch(`/api/purg/${usuario_id}/ultimos-dados-financeiros`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar últimos dados financeiros'))
        .then(dados => {
            console.log('Últimos dados financeiros:', dados);
            const valorCarteira = document.getElementById('valorCarteira');
            const rendimentoDiario = document.getElementById('rendimentoDiario');
            if (valorCarteira) {
                valorCarteira.textContent = parseFloat(dados.carteira_dia).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            }
            if (rendimentoDiario) {
                rendimentoDiario.textContent = parseFloat(dados.rendimento_dia).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            }
            return dados;
        })
        .catch(error => console.error('Erro ao carregar últimos dados financeiros:', error));
}

function loadSaques(usuario_id) {
    return fetch(`/api/ecossistema/${usuario_id}/dados-saques`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar saques'))
        .then(dadosSaques => {
            const totalSaqueElement = document.getElementById('totalSaque');
            if (totalSaqueElement) {
                const totalSaque = dadosSaques['SUM(valor_saque)'] || 0;
                totalSaqueElement.textContent = parseFloat(totalSaque).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            } else {
                console.error('Elemento totalSaque não encontrado no DOM.');
            }
        })
        .catch(error => console.error('Erro ao carregar saques do usuário:', error));
}

function loadDadosFinanceirosHistoricos(usuario_id) {
    return fetch(`/api/purg/${usuario_id}/dados-financeiros-historicos`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar dados financeiros históricos'))
        .then(dados => {
            console.log('Dados financeiros históricos:', dados);
            return dados;
        })
        .catch(error => console.error('Erro ao carregar dados financeiros históricos:', error));
}

let carteiraChart;

function renderizarGrafico(dados) {
    const canvas = document.getElementById('carteiraChart');
    if (!canvas) {
        console.error('Elemento canvas "carteiraChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (carteiraChart) {
        carteiraChart.destroy();
    }

    const labels = dados.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dados.map(d => parseFloat(d.carteira_dia));

    carteiraChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor da Carteira (R$)',
                data: valores,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Valor em R$' }
                },
                x: {
                    title: { display: true, text: 'Datas' }
                }
            }
        }
    });
}

function loadDadosRendimentosHistoricos(usuario_id) {
    return fetch(`/api/purg/${usuario_id}/dados-financeiros-rendimentos-historicos`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar dados de rendimentos históricos'))
        .then(dados => {
            console.log('Dados de rendimentos históricos:', dados);
            return dados;
        })
        .catch(error => console.error('Erro ao carregar dados de rendimentos históricos:', error));
}

let carteiraRendimentosChart;

function renderizarGraficoRendimentos(dados) {
    const canvas = document.getElementById('carteiraRendimentosChart');
    if (!canvas) {
        console.error('Elemento canvas "carteiraRendimentosChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (carteiraRendimentosChart) {
        carteiraRendimentosChart.destroy();
    }

    const labels = dados.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dados.map(d => parseFloat(d.rendimento_dia));

    carteiraRendimentosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rendimentos da Carteira (R$)',
                data: valores,
                borderColor: 'rgba(160, 212, 124, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Valor em R$' }
                },
                x: {
                    title: { display: true, text: 'Datas' }
                }
            }
        }
    });
}

function createTokenCardHTML(token) {
    return `
        <div class="card">
            <h4>${token.razao_social}</h4>
            <p><strong>Risco:</strong> ${token.risco}</p>
            <p><strong>Quantidade de Tokens:</strong> ${token.quantidade_tokens}</p>
            <p><strong>Valor do Token:</strong> R$ ${token.valor_token.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Rendimento do Token:</strong> R$ ${token.rendimento_token.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Vencimento:</strong> ${formatDate(token.vencimento)}</p>
            <p><strong>Dias para Vencimento:</strong> ${token.dias_vencimento}</p>
        </div>
    `;
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('pt-BR', options);
}

window.loadEcossistemaResults = loadEcossistemaResults;

