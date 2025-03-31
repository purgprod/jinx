import dicionarioRespostas from './dicionario_respostas.js';

// Variável para armazenar os dados dos tokens
let tokensData = [];

function loadUserDetails(usuario_id) {
    const data = userDataMap[usuario_id];
    if (data) {
        const centerPanel = document.querySelector('.center-panel');
        if (centerPanel) {
            centerPanel.innerHTML = `
                <h2>Detalhes do usuário ${data.nome}</h2>
                <form id="financialDetailsForm">
                    ${generateUserInputFields(data)}
                    <div class="button-container">
                        <button type="button" id="editButton" class="button-azul">Editar</button>
                        <button type="submit" id="saveButton" class="button-azul">Salvar</button>
                        <button type="button" id="resetButton" class="button-verde">Resetar a Senha</button>
                        ${data.status_ativo === 0 ? `
                            <button type="button" id="ativarButton" class="button-verde">Ativar</button>
                        ` : `
                            <button type="button" id="inativarButton" class="button-vermelho">Inativar</button>
                        `}
                    </div>
                </form>
                <div id="carteiraContainer" class="carteira-container"></div>
                <h3>Distribuição da Carteira por Perfil</h3>
                <div id="chartsContainer">
                    <canvas id="genericRisksDistributionChart"></canvas>
                    <canvas id="genericRisksPercentageChart"></canvas>
                    <canvas id="genericRisksRendimentoChart"></canvas>
		</div>
		
		<h3>Distribuição da Carteira por Tokens</h3>
                <div id="chartsContainer">
                    <canvas id="risksDistributionChart"></canvas>
                    <canvas id="risksPercentageChart"></canvas>
                    <canvas id="risksRendimentoChart"></canvas>
                </div>
                <h3>Tokens do Usuário</h3>
                <div id="tokensContainer" class="cards-container"></div>
                <h3>Suitability</h3>
                <form id="suitabilityDetailsForm">
                    ${generateSuitabilitySection(data)}
                </form>
            `;

            setupEventListenersUsuarios(usuario_id);
            loadSuitability(usuario_id);  

            Promise.all([
                loadUserTokens(usuario_id), 
                loadUltimosDadosFinanceiros(usuario_id),
                loadDadosFinanceirosHistoricos(usuario_id), 
                loadDadosRendimentosHistoricos(usuario_id) 
            ]).then(() => {
                return Promise.all([
		loadSaques(usuario_id),
		loadDepositos(usuario_id)
		]);
	    //    return loadSaques(usuario_id);
            //    return loadDepositos(usuario_id);
            }).then(() => {
                console.log("Todas as chamadas de API foram completadas.");
                renderizarGraficoDistribuicaoRisco(); 
                renderizarGraficoPorcentagemRisco();
                renderizarGraficoRendimentoPorRisco();
		renderizarGraficoDistribuicaoRiscoGenerico();
		renderizarGraficoPorcentagemRiscoGenerico();
		renderizarGraficoRendimentoPorRiscoGenerico();
            }).catch(err => {
                console.error("Erro ao carregar dados:", err);
            });

            const resetButton = document.getElementById('resetButton');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    resetarSenha(usuario_id);
                });
            }
        } else {
            console.error('Elemento center-panel não encontrado.');
        }
    } else {
        console.error('Dados não encontrados para o ID:', usuario_id);
    }
}

function generateSuitabilitySection(data) {
    return `
        <label for="qual_objetivo">Qual o seu principal objetivo ao investir seu dinheiro?</label>
        <input type="text" id="qual_objetivo" name="qual_objetivo" value="${dicionarioRespostas.qual_objetivo[data.qual_objetivo] ?? 'Não especificado'}" readonly>
        <label for="quanto_tempo">Por quanto tempo pretende deixar seu dinheiro investido?</label>
        <input type="text" id="quanto_tempo" name="quanto_tempo" value="${dicionarioRespostas.quanto_tempo[data.quanto_tempo] ?? 'Não especificado'}" readonly>
        <label for="qual_necessidade">Qual é a sua necessidade em relação ao dinheiro que está investindo?</label>
        <input type="text" id="qual_necessidade" name="qual_necessidade" value="${dicionarioRespostas.qual_necessidade[data.qual_necessidade] ?? 'Não especificado'}" readonly>
        <label for="qual_percentual">Qual percentual da sua renda você investe regularmente?</label>
        <input type="text" id="qual_percentual" name="qual_percentual" value="${data.qual_percentual ?? 'Não especificado'}" readonly>
        <label for="oscilacoes_mercado">Por conta de oscilações do mercado, o que você faria?</label>
        <input type="text" id="oscilacoes_mercado" name="oscilacoes_mercado" value="${dicionarioRespostas.oscilacoes_mercado[data.oscilacoes_mercado] ?? 'Não especificado'}" readonly>
        <label for="formacao">Considerando sua formação, é possível afirmar que:</label>
        <input type="text" id="formacao" name="formacao" value="${dicionarioRespostas.formacao[data.formacao] ?? 'Não especificado'}" readonly>
        <label for="experiencia">Considerando sua experiência profissional, é possível afirmar que:</label>
        <input type="text" id="experiencia" name="experiencia" value="${dicionarioRespostas.experiencia[data.experiencia] ?? 'Não especificado'}" readonly>
        <label for="expectativa_5_anos">Como você descreveria sua expectativa de renda futura para os próximos 5 anos?</label>        
        <input type="text" id="expectativa_5_anos" name="expectativa_5_anos" value="${dicionarioRespostas.expectativa_5_anos[data.expectativa_5_anos] ?? 'Não especificado'}" readonly>
        <label for="operacoes_derivativos">Pretende realizar operações com derivativos?</label>
        <input type="text" id="operacoes_derivativos" name="operacoes_derivativos" value="${dicionarioRespostas.operacoes_derivativos[data.operacoes_derivativos] ?? 'Não especificado'}" readonly>
        <label for="volume_frequencia_renda_fixa_basica">Volume e frequência de operações em Renda fixa Básica:</label>
        <input type="text" id="volume_frequencia_renda_fixa_basica" name="volume_frequencia_renda_fixa_basica" value="${dicionarioRespostas.volume_frequencia_renda_fixa_basica[data.volume_frequencia_renda_fixa_basica] ?? 'Não especificado'}" readonly>
        <label for="volume_frequencia_outros">Volume e frequência de operações em Debêntures e outros fundos:</label>
        <input type="text" id="volume_frequencia_outros" name="volume_frequencia_outros" value="${dicionarioRespostas.volume_frequencia_outros[data.volume_frequencia_outros] ?? 'Não especificado'}" readonly>
        <label for="volume_frequencia_renda_variavel_basica">Volume e frequência de operações em Renda variável básica:</label>
        <input type="text" id="volume_frequencia_renda_variavel_basica" name="volume_frequencia_renda_variavel_basica" value="${dicionarioRespostas.volume_frequencia_renda_variavel_basica[data.volume_frequencia_renda_variavel_basica] ?? 'Não especificado'}" readonly>
        <label for="volume_frequencia_derivativos">Volume e frequência de operações em Derivativos:</label>
        <input type="text" id="volume_frequencia_derivativos" name="volume_frequencia_derivativos" value="${dicionarioRespostas.volume_frequencia_derivativos[data.volume_frequencia_derivativos] ?? 'Não especificado'}" readonly>
        <label for="percentual_aproximado_renda_fixa">Qual o percentual aproximado de seus investimentos em Renda Fixa Básica?</label>
        <input type="number" id="percentual_aproximado_renda_fixa" name="percentual_aproximado_renda_fixa" value="${data.percentual_aproximado_renda_fixa != null ? parseFloat(data.percentual_aproximado_renda_fixa).toFixed(2) : 'Não especificado'}" readonly>
        <label for="percentual_aproximado_outros">Qual o percentual aproximado de seus investimentos em Debêntures e outros fundos?</label>
        <input type="number" id="percentual_aproximado_outros" name="percentual_aproximado_outros" value="${data.percentual_aproximado_outros != null ? parseFloat(data.percentual_aproximado_outros).toFixed(2) : 'Não especificado'}" readonly>
        <label for="percentual_aproximado_renda_variavel">Qual o percentual aproximado de seus investimentos em Renda Variável Básica?</label>
        <input type="number" id="percentual_aproximado_renda_variavel" name="percentual_aproximado_renda_variavel" value="${data.percentual_aproximado_renda_variavel != null ? parseFloat(data.percentual_aproximado_renda_variavel).toFixed(2) : 'Não especificado'}" readonly>
        <label for="percentual_aproximado_derivativos">Qual o percentual aproximado de seus investimentos em Derivativos?</label>
        <input type="number" id="percentual_aproximado_derivativos" name="percentual_aproximado_derivativos" value="${data.percentual_aproximado_derivativos != null ? parseFloat(data.percentual_aproximado_derivativos).toFixed(2) : 'Não especificado'}" readonly>
    `;
}

function loadSuitability(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/suitability`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados de suitability');
            }
            return response.json();
        })
        .then(suitabilityData => {
            console.log('Suitability Data:', suitabilityData);
            
            const suitability = suitabilityData[0];
            const suitabilityInputs = document.querySelectorAll('#suitabilityDetailsForm input:not([id^="percentual_aproximado"])');
            suitabilityInputs.forEach(input => {
                const key = input.name;
                if (suitability[key] !== undefined) {
                    input.value = dicionarioRespostas[key][suitability[key]] || 'Não especificado';
                }
            });

            document.getElementById('percentual_aproximado_renda_fixa').value = suitability.percentual_aproximado_renda_fixa != null ? parseFloat(suitability.percentual_aproximado_renda_fixa).toFixed(2) : 'Não especificado';
            document.getElementById('percentual_aproximado_outros').value = suitability.percentual_aproximado_outros != null ? parseFloat(suitability.percentual_aproximado_outros).toFixed(2) : 'Não especificado';
            document.getElementById('percentual_aproximado_renda_variavel').value = suitability.percentual_aproximado_renda_variavel != null ? parseFloat(suitability.percentual_aproximado_renda_variavel).toFixed(2) : 'Não especificado';
            document.getElementById('percentual_aproximado_derivativos').value = suitability.percentual_aproximado_derivativos != null ? parseFloat(suitability.percentual_aproximado_derivativos).toFixed(2) : 'Não especificado';
        })
        .catch(error => {
            console.error('Erro ao carregar dados de suitability:', error);
        });
}

function loadUserTokens(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/tokens`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar tokens');
            }
            return response.json();
        })
        .then(tokens => {
            console.log("Tokens do usuário:", tokens); // Log dos tokens recebidos
            tokens.forEach(token => {
                token.quantidade_tokens_formatado = (token.quantidade_tokens * 0.01).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            });

            tokensData = tokens;
            const tokensContainer = document.getElementById('tokensContainer');
            if (tokensContainer) {
                tokensContainer.innerHTML = tokens.map(createTokenCardHTML).join('');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar tokens do usuário:', error);
        });
}

function renderizarGraficoDistribuicaoRisco() {
    const canvas = document.getElementById('risksDistributionChart');
    if (!canvas) {
        console.error('Elemento canvas "risksDistributionChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const labels = [];
    const data = [];

    const riscoMap = {};

    tokensData.forEach(token => {
        if (!riscoMap[token.risco]) {
            riscoMap[token.risco] = 0;
        }
        riscoMap[token.risco] += token.quantidade_tokens * 0.01;
    });

    for (const [risco, quantidade] of Object.entries(riscoMap)) {
        labels.push(risco);
        data.push(parseFloat(quantidade.toFixed(2)));
    }

    const distributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição Financeira de Risco dos Tokens (R$)',
                data: data,
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribuição Financeira de Risco dos Tokens (R$)'
                },
                datalabels: {
                    color: '#333333',
                    formatter: (value, ctx) => {
                        return `${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                    }
                }
            }
        },
        plugins: [ChartDataLabels] // Ativa o plugin de Data Labels
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
    const labels = [];
    const data = [];

    const riscoMap = {};

    tokensData.forEach(token => {
        if (!riscoMap[token.risco]) {
            riscoMap[token.risco] = 0;
        }
        riscoMap[token.risco] += token.quantidade_tokens;
    });

    for (const [risco, quantidade] of Object.entries(riscoMap)) {
        labels.push(risco);
        const percentage = (quantidade / totalTokens) * 100;
        data.push(parseFloat(percentage.toFixed(2)));
    }

    const percentageChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição em Porcentagem de Risco dos Tokens (%)',
                data: data,
                backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                borderColor: ['rgba(255, 159, 64, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribuição em Porcentagem de Risco dos Tokens (%)'
                },
                datalabels: {
                    color: '#333333',
                    formatter: (value, ctx) => {
                        return `${value.toFixed(2)}%`;
                    }
                }
            }
        },
        plugins: [ChartDataLabels] // Ativa o plugin de Data Labels
    });
}

// Novo gráfico de rendimento por risco
function renderizarGraficoRendimentoPorRisco() {
    const canvas = document.getElementById('risksRendimentoChart');
    if (!canvas) {
        console.error('Elemento canvas "risksRendimentoChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const labels = [];
    const data = [];
    const riscoMap = {};

    // Calcula o rendimento total por risco
    tokensData.forEach(token => {
        const quantidade = Number(token.quantidade_tokens) || 0; // Tratamento para nulo ou indefinido
        const rendimento = Number(token.rendimento_token) || 0; // Tratamento para nulo ou indefinido
        const rendimentoTotal = quantidade * rendimento; // Calcula o rendimento total
        console.log(`Token: ${token.razao_social}, Rendimento Total: ${rendimentoTotal}`); // Log do rendimento total
        if (!riscoMap[token.risco]) {
            riscoMap[token.risco] = 0; // Inicializa se o risco ainda não estiver no mapa
        }
        riscoMap[token.risco] += rendimentoTotal; // Soma o rendimento ao risco correspondente
    });

    // Prepara os rótulos e dados para o gráfico
    for (const [risco, rendimento] of Object.entries(riscoMap)) {
        labels.push(risco); // Risco como rótulo
        data.push(parseFloat(rendimento.toFixed(8))); // Rendimento com oito casas decimais
    }

    // Configura o gráfico
    const rendimentoPorRiscoChart = new Chart(ctx, {
        type: 'pie', // Tipo de gráfico
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição do Rendimento Diário por Risco (R$)',
                data: data,
                backgroundColor: [ // Cores para o gráfico
                    'rgba(255, 99, 132, 0.2)', 
                    'rgba(54, 162, 235, 0.2)', 
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [ // Cores das bordas
                    'rgba(255, 99, 132, 1)', 
                    'rgba(54, 162, 235, 1)', 
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 2,
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribuição do Rendimento Diário por Risco (R$)'
                },
                datalabels: {
                    color: '#333333',
                    formatter: (value, ctx) => {
                        return `${value.toFixed(8).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                    }
                }
            }
        },
        plugins: [ChartDataLabels] // Ativa o plugin de Data Labels
    });
}

function loadUltimosDadosFinanceiros(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/ultimos-dados-financeiros`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar últimos dados financeiros');
            }
            return response.json();
        })
        .then(dados => {
            console.log('Últimos dados financeiros:', dados);
            displayUltimosDadosFinanceiros(dados, usuario_id);
        })
        .catch(error => {
            console.error('Erro ao carregar últimos dados financeiros:', error);
        });
}

function displayUltimosDadosFinanceiros(dados, usuario_id) {
    const carteiraContainer = document.getElementById('carteiraContainer');
    if (carteiraContainer) {
        carteiraContainer.innerHTML = `
            <h3>Dados Financeiros</h3>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Valor da Carteira:</strong> R$ ${parseFloat(dados.carteira_dia).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Rendimento diário:</strong> R$ ${parseFloat(dados.rendimento_dia).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Total de Saques:</strong> R$ <span id="totalSaque">0.00</span></p>
                    </div>
                </div>
	        <div class="card">
                    <div class="card-content">
                        <p><strong>Total de Depositos:</strong> R$ <span id="totalDeposito">0.00</span></p>
                    </div>
                </div>
            </div>
            <canvas id="carteiraChart"></canvas>
            <canvas id="carteiraRendimentosChart"></canvas>
        `;
    }
}

function loadSaques(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/dados-saques`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar saques');
            }
            return response.json();
        })
        .then(dadosSaques => {
            const totalSaqueElement = document.getElementById('totalSaque');
            const totalSaque = dadosSaques['SUM(valor_saque)'] || 0;
            totalSaqueElement.textContent = parseFloat(totalSaque).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        })
        .catch(error => {
            console.error('Erro ao carregar saques do usuário:', error);
        });
}

function loadDepositos(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/dados-depositos`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar depositos');
            }
            return response.json();
        })
        .then(dadosDepositos => {
            const totalDepositoElement = document.getElementById('totalDeposito');
            const totalDeposito = dadosDepositos['SUM(valor_deposito)'] || 0;
            totalDepositoElement.textContent = parseFloat(totalDeposito).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        })
        .catch(error => {
            console.error('Erro ao carregar depositos do usuário:', error);
        });
}


function loadDadosFinanceirosHistoricos(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/dados-financeiros-historicos`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados financeiros históricos');
            }
            return response.json();
        })
        .then(dados => {
            console.log('Dados financeiros históricos:', dados);
            setTimeout(() => {
                renderizarGrafico(dados);
            }, 100);
        })
        .catch(error => {
            console.error('Erro ao carregar dados financeiros históricos:', error);
        });
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

    if (valores.length === 0) {
        console.error('Nenhum valor encontrado para o gráfico de carteira.');
        return;
    }

    carteiraChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor da Carteira (R$)',
                data: valores,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
            }],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor em R$'
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: 'Datas'
                    },
                }
            }
        }
    });
}

function loadDadosRendimentosHistoricos(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/dados-financeiros-rendimentos-historicos`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados de rendimentos históricos');
            }
            return response.json();
        })
        .then(dados => {
            console.log('Dados de rendimentos históricos:', dados);
            setTimeout(() => {
                renderizarGraficoRendimentos(dados);
            }, 100);
        })
        .catch(error => {
            console.error('Erro ao carregar dados de rendimentos históricos:', error);
        });
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

    if (valores.length === 0) {
        console.error('Nenhum valor encontrado para o gráfico de rendimentos.');
        return;
    }

    carteiraRendimentosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rendimentos da Carteira (R$)',
                data: valores,
                borderColor: 'rgba(160, 212, 124, 1)',
                borderWidth: 2,
                fill: false,
            }],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor em R$'
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: 'Datas'
                    },
                }
            }
        }
    });
}

function renderizarGraficoDistribuicaoRiscoGenerico() {
    const canvas = document.getElementById('genericRisksDistributionChart');
    if (!canvas) {
        console.error('Elemento canvas "genericRisksDistributionChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const riscoGenMap = {
        'Conservador': ['AA', 'AR1', 'AR2', 'A1', 'A2', 'A3', 'BBR1', 'BBR2', 'BB'],
        'Moderado': ['B1', 'B2', 'B3', 'BR1', 'BR2'],
        'Agressivo': ['B4', 'B5', 'B6', 'CR1', 'CR2', 'C1', 'C2', 'C3']
    };

    const distribGenMap = {};

    tokensData.forEach(token => {
        for (const [key, values] of Object.entries(riscoGenMap)) {
            if (values.includes(token.risco)) {
                distribGenMap[key] = (distribGenMap[key] || 0) + token.quantidade_tokens * 0.01;
                break;
            }
        }
    });

    const labels = Object.keys(distribGenMap);
    const data = Object.values(distribGenMap).map(val => parseFloat(val.toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição Genérica de Risco dos Tokens (R$)',
                data: data,
                backgroundColor: ['rgba(102, 187, 106, 0.2)', 'rgba(255, 202, 40, 0.2)', 'rgba(239, 83, 80, 0.2)'],
                borderColor: ['rgba(102, 187, 106, 1)', 'rgba(255, 202, 40, 1)', 'rgba(239, 83, 80, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição Genérica de Risco dos Tokens (R$)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}


function renderizarGraficoPorcentagemRiscoGenerico() {
    const canvas = document.getElementById('genericRisksPercentageChart');
    if (!canvas) {
        console.error('Elemento canvas "genericRisksPercentageChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const totalTokens = tokensData.reduce((sum, token) => sum + token.quantidade_tokens, 0);

    const riscoGenMap = {
        'Conservador': ['AA', 'AR1', 'AR2', 'A1', 'A2', 'A3', 'BBR1', 'BBR2', 'BB'],
        'Moderado': ['B1', 'B2', 'B3', 'BR1', 'BR2'],
        'Agressivo': ['B4', 'B5', 'B6', 'CR1', 'CR2', 'C1', 'C2', 'C3']
    };

    const distribGenMap = {};

    tokensData.forEach(token => {
        for (const [key, values] of Object.entries(riscoGenMap)) {
            if (values.includes(token.risco)) {
                distribGenMap[key] = (distribGenMap[key] || 0) + token.quantidade_tokens;
                break;
            }
        }
    });

    const labels = Object.keys(distribGenMap);
    const data = Object.values(distribGenMap).map(qtd => parseFloat(((qtd / totalTokens) * 100).toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição Genérica em Porcentagem de Risco dos Tokens (%)',
                data: data,
                backgroundColor: ['rgba(102, 187, 106, 0.2)', 'rgba(255, 202, 40, 0.2)', 'rgba(239, 83, 80, 0.2)'],
                borderColor: ['rgba(102, 187, 106, 1)', 'rgba(255, 202, 40, 1)', 'rgba(239, 83, 80, 1)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição Genérica em Porcentagem de Risco dos Tokens (%)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => `${value.toFixed(2)}%`
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}
	
function renderizarGraficoRendimentoPorRiscoGenerico() {
    const canvas = document.getElementById('genericRisksRendimentoChart');
    if (!canvas) {
        console.error('Elemento canvas "genericRisksRendimentoChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    const riscoGenMap = {
        'Conservador': ['AA', 'AR1', 'AR2', 'A1', 'A2', 'A3', 'BBR1', 'BBR2', 'BB'],
        'Moderado': ['B1', 'B2', 'B3', 'BR1', 'BR2'],
        'Agressivo': ['B4', 'B5', 'B6', 'CR1', 'CR2', 'C1', 'C2', 'C3']
    };

    const distribGenMap = {};

    tokensData.forEach(token => {
        const quantidade = token.quantidade_tokens || 0;
        const rendimento = token.rendimento_token || 0;
        for (const [key, values] of Object.entries(riscoGenMap)) {
            if (values.includes(token.risco)) {
                distribGenMap[key] = (distribGenMap[key] || 0) + (quantidade * rendimento);
                break;
            }
        }
    });

    const labels = Object.keys(distribGenMap);
    const data = Object.values(distribGenMap).map(rend => parseFloat(rend.toFixed(8)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição Genérica do Rendimento Diário por Risco (R$)',
                data: data,
                backgroundColor: [
                    'rgba(102, 187, 106, 0.2)',
                    'rgba(255, 202, 40, 0.2)',
                    'rgba(239, 83, 80, 0.2)'
                ],
                borderColor: [
                    'rgba(102, 187, 106, 1)',
                    'rgba(255, 202, 40, 1)',
                    'rgba(239, 83, 80, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição Genérica do Rendimento Diário por Risco (R$)' },
                datalabels: {
                    color: '#333333',
                    formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            }
        },
        plugins: [ChartDataLabels]
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

function generateUserInputFields(data) {
    return `
        <label for="email">E-mail:</label>
        <input type="text" id="email" name="email" value="${data.email ?? ''}" readonly>
        <label for="nome">Nome:</label>
        <input type="text" id="nome" name="nome" value="${data.nome ?? ''}" readonly>
        <label for="nome_completo">Nome Completo:</label>
        <input type="text" id="nome_completo" name="nome_completo" value="${data.nome_completo ?? ''}" readonly>
        <label for="cpf">CPF:</label>
        <input type="text" id="cpf" name="cpf" maxlength="14" value="${data.cpf ?? ''}" readonly> 
        <label for="nome_da_mae">Nome da Mãe:</label>
        <input type="text" id="nome_da_mae" name="nome_da_mae" value="${data.nome_da_mae ?? ''}" readonly>
        <label for="genero">Gênero:</label>
        <input type="text" id="genero" name="genero" value="${data.genero ?? ''}" readonly>
        <label for="celular">Celular:</label>
        <input type="text" id="celular" name="celular" maxlength="14" value="${data.celular ?? ''}" readonly>
        <label for="estado">Estado:</label>
        <input type="text" id="estado" name="estado" value="${data.estado ?? ''}" readonly>
        <label for="cidade">Cidade:</label>
        <input type="text" id="cidade" name="cidade" value="${data.cidade ?? ''}" readonly>
        <label for="cep">CEP:</label>
        <input type="text" id="cep" name="cep" maxlength="11" value="${data.cep ?? ''}" readonly>
        <label for="bairro">Bairro:</label>
        <input type="text" id="bairro" name="bairro" value="${data.bairro ?? ''}" readonly>
        <label for="logradouro">Logradouro:</label>
        <input type="text" id="logradouro" name="logradouro" value="${data.logradouro ?? ''}" readonly>
        <label for="numero_da_rua">Número da Rua:</label>
        <input type="number" id="numero_da_rua" name="numero_da_rua" maxlength="11" value="${data.numero_da_rua ?? ''}" readonly>
        <label for="complemento">Complemento:</label>
        <input type="text" id="complemento" name="complemento" value="${data.complemento ?? ''}" readonly>
        <label for="termos_de_uso">Termos de Uso:</label>
        <input type="number" id="termos_de_uso" name="termos_de_uso" maxlength="11" value="${data.termos_de_uso ?? ''}" readonly>
        <label for="data_criacao">Data de Criação:</label>
        <input type="date" id="created_at" name="created_at" value="${data.created_at ? formatDate(data.created_at) : ''}" readonly>
        <label for="data_nascimento">Data de Nascimento:</label>
        <input type="date" id="data_nascimento" name="data_nascimento" value="${data.data_nascimento ? formatDate(data.data_nascimento) : ''}" readonly>
        <label for="data_ultima_alteracao">Última Alteração:</label>
        <input type="date" id="data_ultima_alteracao" name="data_ultima_alteracao" value="${data.data_ultima_alteracao ? formatDate(data.data_ultima_alteracao) : ''}" readonly>    
    `;
}

function setupEventListenersUsuarios(usuario_id) {
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.addEventListener('click', () => {
            document.querySelectorAll('#financialDetailsForm input, #financialDetailsForm textarea').forEach(element => {
                element.removeAttribute('readonly');
            });
        });
    } else {
        console.error('Botão Editar não encontrado.');
    }

    const form = document.getElementById('financialDetailsForm');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const updatedData = Object.fromEntries(formData.entries());

            for (let key in updatedData) {
                if (updatedData[key] === '') {
                    updatedData[key] = null;
                }
            }

            fetch(`/api/usuarios/${usuario_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Erro ao atualizar o usuário.');
                }
            })
            .then(data => {
                if (data.changedRows === 0) {
                    alert('Nenhuma alteração foi feita nos dados do usuário. Verifique os valores informados.');
                } else {
                    alert('Usuário atualizado com sucesso!');
                    refreshPage();
                }
            })
            .catch(error => {
                console.error('Erro ao atualizar o usuário:', error);
                alert('Erro ao atualizar o usuário.');
            });
        });
    } else {
        console.error('Formulário não encontrado.');
    }

    setupToggleActivationButton(usuario_id, 'ativar', 'ativar');
    setupToggleActivationButton(usuario_id, 'inativar', 'inativar');
}

function refreshPage() {
    location.reload();
}

function setupToggleActivationButton(usuario_id, buttonId, action) {
    const button = document.getElementById(buttonId + 'Button');
    if (button) {
        button.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja ${action} este usuário?`)) {
                fetch(`/api/usuarios/${usuario_id}/${action}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                })
                .then(response => {
                    if (response.ok) {
                        alert(`Usuário ${action} com sucesso!`);
                        refreshPage();
                    } else {
                        return response.json().then(data => Promise.reject(data));
                    }
                })
                .catch(error => {
                    console.error(`Erro ao ${action} o usuário:`, error);
                    alert(`Erro ao ${action} o usuário.`);
                });
            }
        });
    }
}

function resetarSenha(usuario_id) {
    fetch(`/api/usuarios/${usuario_id}/resetar-senha`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Senha redefinida com sucesso!');
            location.reload();
        } else {
            alert('Erro ao redefinir a senha.');
        }
    })
    .catch(error => {
        console.error('Erro ao redefinir a senha:', error);
        alert('Erro ao redefinir a senha.');
    });
}

window.loadUserDetails = loadUserDetails;

