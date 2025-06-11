let tokensData = [];
let tokensEcossistemaData = [];
let saquesHistoricosData = [];
let depositosHistoricosData = [];

let carteiraChart;
let carteiraRendimentosChart;
let transacoesChart;
let saquesHistoricosChart;
let depositosHistoricosChart;
let fluxoCaixaChart;

// Função principal para carregar os resultados e ajustar o painel
async function loadEcossistemaResults() {
    const usuario_id = 1;
    const data = userDataMap[usuario_id];

    if (!data) {
        console.error('Dados não encontrados para o ID:', usuario_id);
        return;
    }

    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) {
        console.error('Elemento center-panel não encontrado.');
        return;
    }

    centerPanel.innerHTML = `
        <div id="carteiraContainer" class="carteira-container">
            <h3>Fluxo de Caixa</h3>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Total de Depósitos:</strong> R$ <span id="totalDeposito">0,00</span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Total de Saques:</strong> R$ <span id="totalSaque">0,00</span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Fluxo de Caixa:</strong> R$ <span id="totalBalanca">0,00</span></p>
                    </div>
                </div>
            </div>
        </div>
        <canvas id="depositosHistoricosChart" width="400" height="200"></canvas>
        <canvas id="saquesHistoricosChart" width="400" height="200"></canvas>
        <canvas id="fluxoCaixaHistoricosChart" width="400" height="200"></canvas>
        <div id="carteiraContainer" class="carteira-container">
            <h3>Evolução das Carteiras</h3>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Valor da Carteira (Purg):</strong> R$ <span id="valorCarteira">0,00</span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Valor da Carteira (Ecossistema):</strong> R$ <span id="valorCarteiraEcossistema">0,00</span></p>
                    </div>
                </div>
            </div>
        </div>
        <canvas id="carteiraChart" width="400" height="200"></canvas>
        <div id="carteiraContainer" class="carteira-container">
            <h3>Evolução dos Rendimentos</h3>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Rendimento Diário (Purg):</strong> R$ <span id="rendimentoDiario">0,00</span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Rendimento Diário (Ecossistema):</strong> R$ <span id="rendimentoDiarioEcossistema">0,00</span></p>
                    </div>
                </div>
            </div>
        </div>
        <canvas id="carteiraRendimentosChart" width="400" height="200"></canvas>
	<h3>Transações de Compra e Venda de Tokens</h3>
	<canvas id="transacoesChart" width="400" height="200"></canvas>
        <h3>Distribuição da Carteira Purg</h3>
        <div id="chartsContainer">    
            <canvas id="risksDistributionChart"></canvas>
            <canvas id="risksPercentageChart"></canvas>
            <canvas id="risksRendimentoChart"></canvas>
        </div>
        <br>
        <h3>Distribuição da Carteira Ecossistema</h3>
        <div id="chartsContainer">    
            <canvas id="risksDistributionEcossistemaChart"></canvas>
            <canvas id="risksPercentageEcossistemaChart"></canvas>
            <canvas id="risksRendimentoEcossistemaChart"></canvas>
        </div>
        <br>
        <h3>Tokens da Purg</h3>
        <div id="tokensContainer" class="cards-container"></div>
        <br>
        <h3>Tokens do Ecossistema</h3>
        <div id="tokensContainerEcossistema" class="cards-container"></div>
    `;

    // Carregar dados
    try {
        const [
            tokens,
            tokensEcossistema,
            ultimosDados,
            ultimosDadosEcossistema,
            dadosFinanceirosHistoricos,
            dadosRendimentosHistoricos,
            dadosRendimentosEcossistema,
            dadosFinanceirosHistoricosEcossistema
        ] = await Promise.all([
            loadUserTokens(usuario_id),
            loadEcossistemaTokens(usuario_id),
            loadUltimosDadosFinanceiros(usuario_id),
            loadUltimosDadosFinanceirosEcossistema(usuario_id),
            loadDadosFinanceirosHistoricos(usuario_id),
            loadDadosRendimentosHistoricos(usuario_id),
            loadDadosRendimentosHistoricosEcossistema(usuario_id),
            loadDadosFinanceirosHistoricosEcossistema(usuario_id)
        ]);

        await loadSaques(usuario_id);
        await loadDepositos(usuario_id);
        await loadBalanca(usuario_id);
        await loadSaquesHistoricos(usuario_id);
        await loadDepositosHistoricos(usuario_id);

        // Renderizar gráficos com dados que foram carregados
        renderizarGraficoDistribuicaoRisco();
        renderizarGraficoDistribuicaoRiscoEcossistema();
        renderizarGraficoPorcentagemRisco();
        renderizarGraficoPorcentagemRiscoEcossistema();
        renderizarGraficoRendimentoPorRisco();
        renderizarGraficoRendimentoPorRiscoEcossistema();
        renderizarGrafico(dadosFinanceirosHistoricos, dadosFinanceirosHistoricosEcossistema);
        renderizarGraficoRendimentos(dadosRendimentosHistoricos, dadosRendimentosEcossistema);
        renderizarGraficoSaquesHistóricos(saquesHistoricosData);
        renderizarGraficoDepositosHistoricos(depositosHistoricosData);
        renderizarGraficoTransacoes(usuario_id);
        renderizarGraficoFluxoCaixaHistoricos();
        console.log("Todas as chamadas de API foram completadas.");
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
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
                backgroundColor: [                    
		    'rgba(255, 99, 132, 0.2)',  // Rosa
                    'rgba(54, 162, 235, 0.2)',   // Azul
                    'rgba(255, 206, 86, 0.2)',   // Amarelo
                    'rgba(75, 192, 192, 0.2)',   // Verde água
                    'rgba(153, 102, 255, 0.2)',  // Roxo
                    'rgba(200, 200, 200, 0.2)',   // Cinza claro
                    'rgba(255, 99, 71, 0.2)',    // Vermelho
                    'rgba(124, 252, 0, 0.2)',    // Verde
                    'rgba(0, 191, 255, 0.2)',     // Azul claro
                    'rgba(255, 159, 64, 0.2)'   // Laranja
                ],
                borderColor: [ // Cores das bordas
                    'rgba(255, 99, 132, 1)', 
                    'rgba(54, 162, 235, 1)', 
                    'rgba(255, 206, 86, 1)', 
                    'rgba(75, 192, 192, 1)', 
                    'rgba(153, 102, 255, 1)', 
                    'rgba(255, 159, 64, 1)', 
                    'rgba(200, 200, 200, 1)', 
                    'rgba(255, 99, 71, 1)', 
                    'rgba(124, 252, 0, 1)', 
                    'rgba(0, 191, 255, 1)'
		],
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
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',  // Rosa
                    'rgba(54, 162, 235, 0.2)',   // Azul
                    'rgba(255, 206, 86, 0.2)',   // Amarelo
                    'rgba(75, 192, 192, 0.2)',   // Verde água
                    'rgba(153, 102, 255, 0.2)',  // Roxo
                    'rgba(200, 200, 200, 0.2)',   // Cinza claro
                    'rgba(255, 99, 71, 0.2)',    // Vermelho
                    'rgba(124, 252, 0, 0.2)',    // Verde
                    'rgba(0, 191, 255, 0.2)',     // Azul claro
                    'rgba(255, 159, 64, 0.2)'   // Laranja
                ],
                borderColor: [ // Cores das bordas
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(200, 200, 200, 1)',
                    'rgba(255, 99, 71, 1)',
                    'rgba(124, 252, 0, 1)',
                    'rgba(0, 191, 255, 1)'
		],
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
    const data = Object.values(riscoMap).map(rend => parseFloat(rend.toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição do Rendimento Diário por Risco (R$)',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',  // Rosa
                    'rgba(54, 162, 235, 0.2)',   // Azul
                    'rgba(255, 206, 86, 0.2)',   // Amarelo
                    'rgba(75, 192, 192, 0.2)',   // Verde água
                    'rgba(153, 102, 255, 0.2)',  // Roxo
                    'rgba(200, 200, 200, 0.2)',   // Cinza claro
                    'rgba(255, 99, 71, 0.2)',    // Vermelho
                    'rgba(124, 252, 0, 0.2)',    // Verde
                    'rgba(0, 191, 255, 0.2)',     // Azul claro
                    'rgba(255, 159, 64, 0.2)'   // Laranja
                ],
                borderColor: [ // Cores das bordas
                    'rgba(255, 99, 132, 1)', 
                    'rgba(54, 162, 235, 1)', 
                    'rgba(255, 206, 86, 1)', 
                    'rgba(75, 192, 192, 1)', 
                    'rgba(153, 102, 255, 1)', 
                    'rgba(255, 159, 64, 1)', 
                    'rgba(200, 200, 200, 1)', 
                    'rgba(255, 99, 71, 1)', 
                    'rgba(124, 252, 0, 1)', 
                    'rgba(0, 191, 255, 1)'
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
            console.log("Tokens do ecossistema:", tokens);
            
            // Consolidar valores por token utilizando id_token como identificador
            const tokenSoma = tokens.reduce((acc, token) => {
                // Verifica se o token já está no acumulador
                const existing = acc.find(t => t.token_id === token.token_id);
                if (existing) {
                    // Se o token já existe, soma a quantidade
                    existing.quantidade_tokens += token.quantidade_tokens;
                } else {
                    // Se não existe, adiciona o token ao array com a quantidade inicial
                    acc.push({ id_token: token.token_id, quantidade_tokens: token.quantidade_tokens, ...token });
                }
                return acc;
            }, []);

            // Atualiza a variável global com os dados consolidados
            tokensEcossistemaData = tokenSoma;

            const tokensContainerEcossistema = document.getElementById('tokensContainerEcossistema');
            if (tokensContainerEcossistema) {
                // Mostra o resultado da soma em cards
                tokensContainerEcossistema.innerHTML = tokenSoma.map(createTokenCardHTML).join('');
            }
        })
        .catch(error => console.error('Erro ao carregar tokens do ecossistema:', error));
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
                backgroundColor:[ 
		    'rgba(255, 99, 132, 0.2)',  // Rosa
                    'rgba(54, 162, 235, 0.2)',   // Azul
                    'rgba(255, 206, 86, 0.2)',   // Amarelo
                    'rgba(75, 192, 192, 0.2)',   // Verde água
                    'rgba(153, 102, 255, 0.2)',  // Roxo
                    'rgba(200, 200, 200, 0.2)',   // Cinza claro
                    'rgba(255, 99, 71, 0.2)',    // Vermelho
                    'rgba(124, 252, 0, 0.2)',    // Verde
                    'rgba(0, 191, 255, 0.2)',     // Azul claro
                    'rgba(255, 159, 64, 0.2)'   // Laranja
                ],
                borderColor: [ // Cores das bordas
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(200, 200, 200, 1)',
                    'rgba(255, 99, 71, 1)',
                    'rgba(124, 252, 0, 1)',
                    'rgba(0, 191, 255, 1)'
		],
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
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',  // Rosa
                    'rgba(54, 162, 235, 0.2)',   // Azul
                    'rgba(255, 206, 86, 0.2)',   // Amarelo
                    'rgba(75, 192, 192, 0.2)',   // Verde água
                    'rgba(153, 102, 255, 0.2)',  // Roxo
                    'rgba(200, 200, 200, 0.2)',   // Cinza claro
                    'rgba(255, 99, 71, 0.2)',    // Vermelho
                    'rgba(124, 252, 0, 0.2)',    // Verde
                    'rgba(0, 191, 255, 0.2)',     // Azul claro
                    'rgba(255, 159, 64, 0.2)'   // Laranja
                ],
                borderColor: [ // Cores das bordas
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(200, 200, 200, 1)',
                    'rgba(255, 99, 71, 1)',
                    'rgba(124, 252, 0, 1)',
                    'rgba(0, 191, 255, 1)'   
		],
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
    const data = Object.values(riscoMap).map(rend => parseFloat(rend.toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição do Rendimento Diário por Risco (R$)',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',  // Rosa
                    'rgba(54, 162, 235, 0.2)',   // Azul
                    'rgba(255, 206, 86, 0.2)',   // Amarelo
                    'rgba(75, 192, 192, 0.2)',   // Verde água
                    'rgba(153, 102, 255, 0.2)',  // Roxo
                    'rgba(200, 200, 200, 0.2)',   // Cinza claro
                    'rgba(255, 99, 71, 0.2)',    // Vermelho
                    'rgba(124, 252, 0, 0.2)',    // Verde
                    'rgba(0, 191, 255, 0.2)',     // Azul claro
                    'rgba(255, 159, 64, 0.2)'   // Laranja
                ],
                borderColor: [ // Cores das bordas
                    'rgba(255, 99, 132, 1)', 
                    'rgba(54, 162, 235, 1)', 
                    'rgba(255, 206, 86, 1)', 
                    'rgba(75, 192, 192, 1)', 
                    'rgba(153, 102, 255, 1)', 
                    'rgba(255, 159, 64, 1)', 
                    'rgba(200, 200, 200, 1)', 
                    'rgba(255, 99, 71, 1)', 
                    'rgba(124, 252, 0, 1)', 
                    'rgba(0, 191, 255, 1)'   
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
            console.log('Últimos dados financeiros Purg:', dados);
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
        .catch(error => console.error('Erro ao carregar últimos dados financeiros da purg:', error));
}

function loadUltimosDadosFinanceirosEcossistema(usuario_id) {
    return fetch(`/api/ecossistema/${usuario_id}/ultimos-dados-financeiros`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar últimos dados financeiros do ecossistema'))
        .then(dados => {
            console.log('Últimos dados financeiros Ecossistema:', dados);
            const valorCarteiraEcossistema = document.getElementById('valorCarteiraEcossistema');
            const rendimentoDiarioEcossistema = document.getElementById('rendimentoDiarioEcossistema');
            if (valorCarteiraEcossistema) {
                valorCarteiraEcossistema.textContent = parseFloat(dados.carteira_dia).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            }
            if (rendimentoDiarioEcossistema) {
                rendimentoDiarioEcossistema.textContent = parseFloat(dados.rendimento_dia).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            }
            return dados;
        })
        .catch(error => console.error('Erro ao carregar últimos dados financeiros do ecossistema:', error));
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

function loadDepositos(usuario_id) {
    return fetch(`/api/ecossistema/${usuario_id}/dados-depositos`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar Depositos'))
        .then(dadosDepositos => {
            const totalDepositoElement = document.getElementById('totalDeposito');
            if (totalDepositoElement) {
                const totalDeposito = dadosDepositos['SUM(valor_deposito)'] || 0;
                totalDepositoElement.textContent = parseFloat(totalDeposito).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            } else {
                console.error('Elemento totalDeposito não encontrado no DOM.');
            }
        })
        .catch(error => console.error('Erro ao carregar Depositos do usuário:', error));
}

// Nova função: Calcula a balança (depósitos - saques)
async function loadBalanca(usuario_id) {
    try {
        const [depositosResponse, saquesResponse] = await Promise.all([
            fetch(`/api/ecossistema/${usuario_id}/dados-depositos`),
            fetch(`/api/ecossistema/${usuario_id}/dados-saques`)
        ]);

        if (!depositosResponse.ok || !saquesResponse.ok) {
            throw new Error('Erro ao buscar dados de depósitos ou saques');
        }

        const dadosDepositos = await depositosResponse.json();
        const dadosSaques = await saquesResponse.json();

        const totalDeposito = dadosDepositos['SUM(valor_deposito)'] || 0;
        const totalSaque = dadosSaques['SUM(valor_saque)'] || 0;
        const balanca = totalDeposito - totalSaque;

        const totalBalancaElement = document.getElementById('totalBalanca');
        if (totalBalancaElement) {
            totalBalancaElement.textContent = parseFloat(balanca).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        } else {
            console.error('Elemento totalBalanca não encontrado no DOM.');
        }
    } catch (error) {
        console.error('Erro ao carregar Balança do usuário:', error);
    }
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

// Nova função para carregar os dados financeiros históricos do Ecossistema
function loadDadosFinanceirosHistoricosEcossistema(usuario_id) {
    return fetch(`/api/ecossistema/${usuario_id}/dados-financeiros-historicos`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar dados financeiros históricos do ecossistema'))
        .then(dados => {
            console.log('Dados financeiros históricos do ecossistema:', dados);
            return dados;
        })
        .catch(error => console.error('Erro ao carregar dados financeiros históricos do ecossistema:', error));
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

function loadDadosRendimentosHistoricosEcossistema(usuario_id) {
    return fetch(`/api/ecossistema/${usuario_id}/dados-financeiros-rendimentos-historicos`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar dados de rendimentos históricos do ecossistema'))
        .then(dados => {
            console.log('Dados de rendimentos históricos do ecossistema:', dados);
            return dados;
        })
        .catch(error => console.error('Erro ao carregar dados de rendimentos históricos do ecossistema:', error));
}

function renderizarGrafico(dadosPurg, dadosEcossistema) {
    const canvas = document.getElementById('carteiraChart');
    if (!canvas) {
        console.error('Elemento canvas "carteiraChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (carteiraChart) {
        carteiraChart.destroy();
    }

    const labels = [...new Set([
        ...dadosPurg.map(d => new Date(d.data_criacao).toLocaleDateString()),
        ...dadosEcossistema.map(d => new Date(d.data_criacao).toLocaleDateString())
    ])].sort(); // Obtém labels únicas e ordenadas

    const valoresPurg = labels.map(label => {
        const valorPurg = dadosPurg.find(d => new Date(d.data_criacao).toLocaleDateString() === label);
        return valorPurg ? parseFloat(valorPurg.carteira_dia) : 0;
    });

    const valoresEcossistema = labels.map(label => {
        const valorEco = dadosEcossistema.find(d => new Date(d.data_criacao).toLocaleDateString() === label);
        return valorEco ? parseFloat(valorEco.carteira_dia) : 0;
    });

    carteiraChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor da Carteira Purg (R$)',
                data: valoresPurg,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }, {
                label: 'Valor da Carteira Ecossistema (R$)',
                data: valoresEcossistema,
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

function renderizarGraficoRendimentos(rendimentosPurg, rendimentosEcossistema) {
    const canvas = document.getElementById('carteiraRendimentosChart');
    if (!canvas) {
        console.error('Elemento canvas "carteiraRendimentosChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (carteiraRendimentosChart) {
        carteiraRendimentosChart.destroy();
    }

    const labels = [...new Set([
        ...rendimentosPurg.map(d => new Date(d.data_criacao).toLocaleDateString()),
        ...rendimentosEcossistema.map(d => new Date(d.data_criacao).toLocaleDateString())
    ])].sort(); // Obtém labels únicas e ordenadas

    const valoresPurg = labels.map(label => {
        const rendimento = rendimentosPurg.find(d => new Date(d.data_criacao).toLocaleDateString() === label);
        return rendimento ? parseFloat(rendimento.rendimento_dia) : 0; // Retorna 0 se não houver rendimento para a data
    });

    const valoresEcossistema = labels.map(label => {
        const rendimento = rendimentosEcossistema.find(d => new Date(d.data_criacao).toLocaleDateString() === label);
        return rendimento ? parseFloat(rendimento.rendimento_dia) : 0; // Retorna 0 se não houver rendimento para a data
    });

    carteiraRendimentosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rendimentos da Carteira Purg',
                data: valoresPurg,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }, {
                label: 'Rendimentos da Carteira Ecossistema',
                data: valoresEcossistema,
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


// Função para carregar os saques históricos
async function loadSaquesHistoricos(usuario_id) {
    try {
        const response = await fetch(`/api/ecossistema/${usuario_id}/dados-saques-historicos`);
        if (!response.ok) throw new Error('Erro ao buscar saques históricos');
        saquesHistoricosData = await response.json();
    } catch (error) {
        console.error('Erro ao carregar dados de saques históricos:', error);
    }
}

function renderizarGraficoSaquesHistóricos(dadosSaques) {
    const canvas = document.getElementById('saquesHistoricosChart');
    if (!canvas) {
        console.error('Elemento canvas "saquesHistoricosChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

    const labels = dadosSaques.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dadosSaques.map(d => parseFloat(d.valor_saque));

    if (saquesHistoricosChart) { // Destruir gráfico existente se já estiver presente
        saquesHistoricosChart.destroy();
    }

    saquesHistoricosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fluxo de Saques (R$)',
                data: valores,
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Valor em R$' }
                },
                x: {
                    title: { display: true, text: 'Datas' }
                }
            }
        }
    });
}

async function loadDepositosHistoricos(usuario_id) {
    try {
        const response = await fetch(`/api/ecossistema/${usuario_id}/dados-depositos-historicos`);
        if (!response.ok) throw new Error('Erro ao buscar depositos históricos');
        depositosHistoricosData = await response.json(); // Armazena os dados na variável global

        // Chama a função para renderizar o gráfico após carregar os dados
        renderizarGraficoDepositosHistoricos(depositosHistoricosData);
    } catch (error) {
        console.error('Erro ao carregar dados de depositos históricos:', error);
    }
}

function renderizarGraficoDepositosHistoricos(dadosDepositos) {
    const canvas = document.getElementById('depositosHistoricosChart');
    if (!canvas) {
        console.error('Elemento canvas "depositosHistoricosChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

    const labels = dadosDepositos.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dadosDepositos.map(d => parseFloat(d.valor_deposito));

    if (depositosHistoricosChart) { // Destruir gráfico existente se já estiver presente
        depositosHistoricosChart.destroy();
    }

    depositosHistoricosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fluxo de Depósitos (R$)',
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
                    beginAtZero: true,
                    title: { display: true, text: 'Valor em R$' }
                },
                x: {
                    title: { display: true, text: 'Datas' }
                }
            }
        }
    });
}

function renderizarGraficoTransacoes(usuario_id) {
    const canvas = document.getElementById('transacoesChart');
    if (!canvas) {
        console.error('Elemento canvas "transacoesChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Carrega os dados de transações usando o caminho correto da API
    fetch(`/api/ecossistema/${usuario_id}/transacao`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao buscar transações');
            return response.json();
        })
        .then(transacoes => {
            // Verifica se transacoes é um array
            if (!Array.isArray(transacoes)) {
                throw new Error('Formato de dados de transação inválido. Esperado um array.');
            }

            const transacoesData = {
                C: [],
                V: []
            };

            transacoes.forEach(transacao => {
                const data = new Date(transacao.data_criacao).toLocaleDateString();
                const valorTransacao = parseFloat(transacao.valor_transacao); // Converte para float

                if (transacao.tipo_transacao === 'C') {
                    transacoesData.C.push({ data, valor: valorTransacao });
                } else if (transacao.tipo_transacao === 'V') {
                    transacoesData.V.push({ data, valor: valorTransacao });
                }
            });

            const labels = [...new Set([...transacoesData.C.map(t => t.data), ...transacoesData.V.map(t => t.data)])].sort();
            const valoresC = labels.map(label => {
                const valor = transacoesData.C.reduce((acc, t) => t.data === label ? acc + t.valor : acc, 0);
                return valor;
            });
            const valoresV = labels.map(label => {
                const valor = transacoesData.V.reduce((acc, t) => t.data === label ? acc + t.valor : acc, 0);
                return valor;
            });

            if (transacoesChart) { // Destruir gráfico existente se já estiver presente
                transacoesChart.destroy();
            }

            transacoesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Transações de Compra (R$)',
                        data: valoresC,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: false
                    }, {
                        label: 'Transações de Venda (R$)',
                        data: valoresV,
                        borderColor: 'rgba(255, 99, 132, 1)',
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
        })
        .catch(error => {
            console.error('Erro ao carregar transações:', error);
        });
}

function renderizarGraficoFluxoCaixaHistoricos() {
    const canvasId = 'fluxoCaixaHistoricosChart';
    let canvas = document.getElementById(canvasId);

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.setAttribute('id', canvasId);
        document.getElementById('carteiraContainer').appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');

    // Obter datas únicas em formato ISO primeiro (para ordenar corretamente depois)
    const labelsISO = [...new Set([
        ...depositosHistoricosData.map(d => new Date(d.data_criacao).toISOString().split('T')[0]),
        ...saquesHistoricosData.map(d => new Date(d.data_criacao).toISOString().split('T')[0])
    ])];

    // Ordenar as datas corretamente
    labelsISO.sort((a, b) => new Date(a) - new Date(b));

    // Converter as datas ISO ordenadas para o padrão local brasileiro
    const labels = labelsISO.map(isoDate => new Date(isoDate + 'T00:00:00Z').toLocaleDateString('pt-BR'));

    // Calcula os valores de depósitos e saques para cada data
    const valoresFluxoCaixa = labelsISO.map(isoLabel => {
        const totalDepositos = depositosHistoricosData.reduce((acc, d) => {
            const dataISO = new Date(d.data_criacao).toISOString().split('T')[0];
            return dataISO === isoLabel ? acc + parseFloat(d.valor_deposito) : acc;
        }, 0);

        const totalSaques = saquesHistoricosData.reduce((acc, d) => {
            const dataISO = new Date(d.data_criacao).toISOString().split('T')[0];
            return dataISO === isoLabel ? acc + parseFloat(d.valor_saque) : acc;
        }, 0);

        return totalDepositos - totalSaques;
    });

    if (fluxoCaixaChart) { 
        fluxoCaixaChart.destroy();
    }

    fluxoCaixaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fluxo de Caixa (R$)',
                data: valoresFluxoCaixa,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Valor em R$' } },
                x: { title: { display: true, text: 'Datas' } }
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

// Torna a função `loadEcossistemaResults` acessível globalmente
window.loadEcossistemaResults = loadEcossistemaResults;

