import ligaAcessoInvestimentos from './acesso_investimentos_por_liga.js';

// Variável para armazenar os dados dos pins
let pinsData = [];

function loadUserDetails(usuario_id) {
    const data = userDataMap[usuario_id];
    if (data) {
        const centerPanel = document.querySelector('.center-panel');
        if (centerPanel) {
            centerPanel.innerHTML = `
                <h2>Detalhes do usuário ${data.apelido}</h2>
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
                <h3>Dados Financeiros</h3>
                <div id="infoContainer" class="info-container"></div>
                <div id="carteiraContainer" class="carteira-container"></div>
                <h3>Distribuição da Carteira por Perfil</h3>
                <div id="chartsContainer">
                    <canvas id="genericRisksDistributionChart"></canvas>
                    <canvas id="genericRisksPercentageChart"></canvas>
                    <canvas id="genericRisksRendimentoChart"></canvas>
                </div>

                <h3>Distribuição da Carteira por Pins</h3>
                <div id="chartsContainer">
                    <canvas id="risksDistributionChart"></canvas>
                    <canvas id="risksPercentageChart"></canvas>
                    <canvas id="risksRendimentoChart"></canvas>
                </div>
                <h3>Pins do Usuário</h3>
                <div id="pinsContainer" class="cards-container"></div>
                <h3>Objetivos</h3>
                <div id="objetivosContainer"></div>
            `;

            setupEventListenersUsuarios(usuario_id);

            Promise.all([
                loadUserPins(usuario_id),
                loadUltimosDadosFinanceiros(usuario_id),
                loadDadosFinanceirosHistoricos(usuario_id),
                loadDadosRendimentosHistoricos(usuario_id),
                loadInfo(usuario_id),
                loadObjetivos(usuario_id)
            ]).then(() => {
                return Promise.all([
                loadSaldos(usuario_id),
                loadSaques(usuario_id),
                loadDepositos(usuario_id),
                loadRendimentos(usuario_id)
                ]);
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


function loadUserPins(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/tokens`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar pins');
            }
            return response.json();
        })
        .then(pins => {
            console.log("Pins do usuário:", pins); // Log dos pins recebidos
            pins.forEach(pin => {
                pin.quantidade_tokens_formatado = (pin.quantidade_tokens * 0.01).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            });

            pinsData = pins;
            const pinsContainer = document.getElementById('pinsContainer');
            if (pinsContainer) {
                pinsContainer.innerHTML = pins.map(createPinCardHTML).join('');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar pins do usuário:', error);
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

    pinsData.forEach(pin => {
        if (!riscoMap[pin.risco]) {
            riscoMap[pin.risco] = 0;
        }
        riscoMap[pin.risco] += pin.quantidade_tokens * 0.01;
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
                label: 'Distribuição Financeira de Risco dos Pins (R$)',
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
                    'rgba(0, 191, 255, 1)'],
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
                    text: 'Distribuição Financeira de Risco dos Pins (R$)'
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
    const totalPins = pinsData.reduce((sum, pin) => sum + pin.quantidade_tokens, 0);
    const labels = [];
    const data = [];

    const riscoMap = {};

    pinsData.forEach(pin => {
        if (!riscoMap[pin.risco]) {
            riscoMap[pin.risco] = 0;
        }
        riscoMap[pin.risco] += pin.quantidade_tokens;
    });

    for (const [risco, quantidade] of Object.entries(riscoMap)) {
        labels.push(risco);
        const percentage = (quantidade / totalPins) * 100;
        data.push(parseFloat(percentage.toFixed(2)));
    }

    const percentageChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição em Porcentagem de Risco dos Pins (%)',
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
                    'rgba(0, 191, 255, 1)'],
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
                    text: 'Distribuição em Porcentagem de Risco dos Pins (%)'
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
    pinsData.forEach(pin => {
        const quantidade = Number(pin.quantidade_tokens) || 0; // Tratamento para nulo ou indefinido
        const rendimento = Number(pin.rendimento_token) || 0; // Tratamento para nulo ou indefinido
        const rendimentoTotal = quantidade * rendimento; // Calcula o rendimento total
        console.log(`Pin: ${pin.razao_social}, Rendimento Total: ${rendimentoTotal}`); // Log do rendimento total
        if (!riscoMap[pin.risco]) {
            riscoMap[pin.risco] = 0; // Inicializa se o risco ainda não estiver no mapa
        }
        riscoMap[pin.risco] += rendimentoTotal; // Soma o rendimento ao risco correspondente
    });

    // Prepara os rótulos e dados para o gráfico
    for (const [risco, rendimento] of Object.entries(riscoMap)) {
        labels.push(risco); // Risco como rótulo
        data.push(parseFloat(rendimento.toFixed(8))); // Rendimento com oito casas decimais
    }

    // Configura o gráfico
        const rendimentoPorRiscoChart = new Chart(ctx, {
                type: 'pie',
                data: {
                        labels: labels,
                        datasets: [{
                                data: data,
                                backgroundColor: [
                                        'rgba(255, 99, 132, 0.2)',  // Rosa
                                        'rgba(54, 162, 235, 0.2)',   // Azul
                                        'rgba(255, 206, 86, 0.2)',   // Amarelo
                                        'rgba(75, 192, 192, 0.2)',   // Verde água
                                        'rgba(153, 102, 255, 0.2)',  // Roxo
                                        'rgba(200, 200, 200, 0.2)',   // Cinza claro
                                        'rgba(255, 99, 71, 0.2)',    // Vermelho
                                        'rgba(124, 252, 0, 0.2)',     // Verde
                                        'rgba(0, 191, 255, 0.2)',    // Azul claro
                                        'rgba(255, 159, 64, 0.2)'   // Laranja
                                ],
                                borderColor: [
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
                                borderWidth: 2,
                                labels: labels // Adicione o array labels ao dataset
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
                                },
                                tooltip: {
                                        callbacks: {
                                                label: function(context) {
                                                        // Verifica se o dataset tem labels e se o dataIndex é válido
                                                        if (context.dataset.labels && context.dataIndex < context.dataset.labels.length) {
                                                                const label = context.dataset.labels[context.dataIndex];
                                                                const value = context.raw || 0;
                                                                return `${label}: R$ ${value.toFixed(8)}`;
                                                        }
                                                        // Caso contrário, retorna um valor padrão
                                                        return `Label não disponível: R$ ${context.raw.toFixed(8)}`;
                                                }
                                        }
                                }
                        }
                },
                plugins: [ChartDataLabels]
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
	    <h3>Carteira Atual</h3>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Saldo da Carteira:</strong> R$ <span id="totalSaldo">0.00</span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Valor Investido:</strong> R$ ${parseFloat(dados.investido).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Rendimento diário:</strong> R$ ${parseFloat(dados.rendimento_token).toFixed(8).toLocaleString('pt-BR', { minimumFractionDigits: 8 })}</p>
                    </div>
                </div>
            </div>
	    <h3>Histórico da Carteira</h3>
            <div class="cards-basico">
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
                <div class="card">
                    <div class="card-content">
                        <p><strong>Total de Rendimentos:</strong> R$ <span id="totalRendimento">0.00000000</span></p>
                    </div>
                </div>				
	    </div>
            <canvas id="carteiraChart"></canvas>
            <canvas id="carteiraRendimentosChart"></canvas>
        `;
    }
}


function loadInfo(usuario_id) {
    return Promise.all([
        fetch(`/api/usuarios/${usuario_id}/liga-usuarios`),
        fetch(`/api/usuarios/${usuario_id}/sinistro-usuarios`)
    ])
    .then(responses => {
        return Promise.all(
            responses.map(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar dados: ${response.status}`);
                }
                return response.json();
            })
        );
    })
    .then(([dadosLiga, dadosSinistro]) => {
        console.log('Dados de Liga:', dadosLiga);
        console.log('Dados de Sinistro:', dadosSinistro);

        // Processa os dados
        const ligaData = dadosLiga && typeof dadosLiga === 'object' ?
            { ...dadosLiga } : { liga: 'Não especificado' };

        const sinistroData = dadosSinistro && typeof dadosSinistro === 'object' ?
            { ...dadosSinistro } : { sinistro: 'Não especificado' };

        // Exibe os dados combinados
        displayInfo(ligaData, sinistroData, usuario_id);
    })
    .catch(error => {
        console.error('Erro ao carregar dados:', error);
        const defaultLiga = { liga: 'Não especificado' };
        const defaultSinistro = { sinistro: 'Não especificado' };
        displayInfo(defaultLiga, defaultSinistro, usuario_id);
    });
}

function displayInfo(ligaData, sinistroData, usuario_id) {
    const infoContainer = document.getElementById('infoContainer');
    if (infoContainer) {
        // Procura pelos acessos de investimentos com base na liga
        const ligaName = ligaData.liga || 'Não especificado';
        const acessoInvestimentos = ligaAcessoInvestimentos.find(item =>
            item.nomeLiga === ligaName
        )?.acessoInvestimentos || ['Nenhum acesso disponível'];

        // Cria o template com os novos dados
        const template = `
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Liga:</strong> ${ligaData.liga || 'Não especificado'}</p>
                    </div>
                </div>
            </div>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Sinistro:</strong> ${sinistroData.sinistro || 'Não especificado'}%</p>
                    </div>
                </div>
            </div>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Acessos de Investimentos:</strong> ${acessoInvestimentos.join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
        
        infoContainer.innerHTML = template;
    }
}

function loadSaldos(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/dados-saldo`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar saldo');
            }
            return response.json();
        })
        .then(dadosSaldos => {
            const totalSaldoElement = document.getElementById('totalSaldo');
            const totalSaldo = dadosSaldos['saldo'] || 0;
            totalSaldoElement.textContent = parseFloat(totalSaldo).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        })
        .catch(error => {
            console.error('Erro ao carregar saldo do usuário:', error);
        });
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

function loadRendimentos(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/dados-rendimentos`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar rendimentos');
            }
            return response.json();
        })
        .then(dadosRendimentos => {
            const totalRendimentoElement = document.getElementById('totalRendimento');
            const totalRendimento = dadosRendimentos['SUM(rendimento_diario)'] || 0;
            totalRendimentoElement.textContent = parseFloat(totalRendimento).toFixed(8).toLocaleString('pt-BR', { minimumFractionDigits: 8 });
        })
        .catch(error => {
            console.error('Erro ao carregar rendimentos do usuário:', error);
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
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: R$ ${value.toFixed(8)}`;
                        }
                    }
                }
            },
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

    pinsData.forEach(pin => {
        for (const [key, values] of Object.entries(riscoGenMap)) {
            if (values.includes(pin.risco)) {
                distribGenMap[key] = (distribGenMap[key] || 0) + pin.quantidade_tokens * 0.01;
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
                label: 'Distribuição Genérica de Risco dos Pins (R$)',
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
                title: { display: true, text: 'Distribuição Genérica de Risco dos Pins (R$)' },
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
    const totalPins = pinsData.reduce((sum, pin) => sum + pin.quantidade_tokens, 0);

    const riscoGenMap = {
        'Conservador': ['AA', 'AR1', 'AR2', 'A1', 'A2', 'A3', 'BBR1', 'BBR2', 'BB'],
        'Moderado': ['B1', 'B2', 'B3', 'BR1', 'BR2'],
        'Agressivo': ['B4', 'B5', 'B6', 'CR1', 'CR2', 'C1', 'C2', 'C3']
    };

    const distribGenMap = {};

    pinsData.forEach(pin => {
        for (const [key, values] of Object.entries(riscoGenMap)) {
            if (values.includes(pin.risco)) {
                distribGenMap[key] = (distribGenMap[key] || 0) + pin.quantidade_tokens;
                break;
            }
        }
    });

    const labels = Object.keys(distribGenMap);
    const data = Object.values(distribGenMap).map(qtd => parseFloat(((qtd / totalPins) * 100).toFixed(2)));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribuição Genérica em Porcentagem de Risco dos Pins (%)',
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
                title: { display: true, text: 'Distribuição Genérica em Porcentagem de Risco dos Pins (%)' },
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

    pinsData.forEach(pin => {
        const quantidade = pin.quantidade_tokens||0;
        const rendimento = pin.rendimento_token||0;
        for (const [key, values] of Object.entries(riscoGenMap)) {
            if (values.includes(pin.risco)) {
                distribGenMap[key] = (distribGenMap[key]||0) + (quantidade * rendimento);
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
                borderWidth: 2,
                labels: labels // Adicione aqui o array labels ao dataset
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
                    formatter: (value, ctx) => {
                        return `${value.toFixed(8).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // Verifica se o dataset tem labels e se o dataIndex é válido
                            if (context.dataset.labels && context.dataIndex < context.dataset.labels.length) {
                                const label = context.dataset.labels[context.dataIndex];
                                const value = context.raw||0;
                                return `${label}: R$ ${value.toFixed(8)}`;
                            }
                            // Caso contrário, retorna um valor padrão
                            return `Label não disponível: R$ ${context.raw.toFixed(8)}`;
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}


function createPinCardHTML(pin) {
    return `
        <div class="card">
            <h4>${pin.razao_social}</h4>
            <p><strong>Risco:</strong> ${pin.risco}</p>
            <p><strong>Quantidade de Pins:</strong> ${pin.quantidade_tokens}</p>
            <p><strong>Valor do Pin:</strong> R$ ${pin.valor_token.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Rendimento do Pin:</strong> R$ ${pin.rendimento_token.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p><strong>Vencimento:</strong> ${formatDate(pin.vencimento)}</p>
            <p><strong>Dias para Vencimento:</strong> ${pin.dias_vencimento}</p>
        </div>
    `;
}

function generateUserInputFields(data) {
    return `
        <label for="email">E-mail:</label>
        <input type="text" id="email" name="email" value="${data.email ?? ''}" readonly>
        <label for="assinatura">Assinatura:</label>
        <input type="text" id="assinatura" name="assinatura" value="${data.assinatura ?? ''}" readonly>
        <label for="data_ultima_alteracao_assinatura">Data da Assinatura:</label>
        <input type="date" id="data_ultima_alteracao_assinatura" name="data_ultima_alteracao_assinatura" value="${data.data_ultima_alteracao_assinatura ? formatDate(data.data_ultima_alteracao_assinatura) : ''}" readonly>
        <label for="apelido">Apelido:</label>
        <input type="text" id="apelido" name="apelido" value="${data.apelido ?? ''}" readonly>
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
        <label for="pix_cpf">Pix CPF:</label>
        <input type="number" id="pix_cpf" name="pix_cpf" maxlength="11" value="${data.pix_cpf ?? ''}" readonly>
	<label for="pix_celular">Pix Celular:</label>
        <input type="number" id="pix_celular" name="pix_celular" maxlength="11" value="${data.pix_celular ?? ''}" readonly>
	<label for="pix_email">Pix E-mail:</label>
        <input type="text" id="pix_email" name="pix_email" maxlength="50" value="${data.pix_email ?? ''}" readonly>
	<label for="pix_chave">Pix Chave:</label>
        <input type="text" id="pix_chave" name="pix_chave" maxlength="100" value="${data.pix_chave ?? ''}" readonly>
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

function loadObjetivos(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/objetivos`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao buscar objetivos');
            return response.json();
        })
        .then(({ objetivos }) => {
            const container = document.getElementById('objetivosContainer');
            if (!container) return;

            if (!objetivos || objetivos.length === 0) {
                container.innerHTML = '<p style="color:#888;">Nenhum objetivo cadastrado.</p>';
                return;
            }

            container.innerHTML = objetivos.map(obj => {
                const progresso = obj.valor_alvo > 0
                    ? Math.min((obj.saldo_alocado_total / obj.valor_alvo) * 100, 100).toFixed(1)
                    : 0;

                const linhasMetas = obj.metas.map(m => {
                    const pct = m.meta > 0
                        ? Math.min((m.aporte / m.meta) * 100, 100).toFixed(1)
                        : 0;
                    const dataFormatada = m.data_limite
                        ? new Date(m.data_limite).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : '—';
                    const metaFmt   = m.meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const aporteFmt = m.aporte.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const rowStyle  = m.completo ? 'background-color:#f0fff0;' : '';

                    return `
                        <tr style="${rowStyle}">
                            <td>Meta ${m.numero}</td>
                            <td>${dataFormatada}</td>
                            <td>${metaFmt}</td>
                            <td>${aporteFmt}</td>
                            <td><strong>${pct}%</strong></td>
                        </tr>`;
                }).join('');

                const totalMetaFmt   = obj.valor_alvo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const totalAporteFmt = obj.saldo_alocado_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const badge          = obj.is_patrimonio
                    ? '<span style="font-size:11px;background:#4682B4;color:#fff;padding:2px 7px;border-radius:10px;margin-left:8px;">Patrimônio</span>'
                    : '';
                const completoBadge  = obj.objetivo_completo
                    ? '<span style="font-size:11px;background:#4CAF50;color:#fff;padding:2px 7px;border-radius:10px;margin-left:8px;">Concluído</span>'
                    : '';

                return `
                    <div class="card" style="width:100%;max-width:100%;margin-bottom:16px;flex:unset;">
                        <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#333;">
                            ${obj.descricao}${badge}${completoBadge}
                        </p>
                        <p style="margin:0 0 12px;font-size:13px;color:#666;">
                            Alvo: ${totalMetaFmt} &nbsp;|&nbsp; Aportado: ${totalAporteFmt} &nbsp;|&nbsp; Progresso geral: <strong>${progresso}%</strong>
                        </p>
                        <table class="rotinas-table" style="margin-top:0;">
                            <thead>
                                <tr>
                                    <th>Meta</th>
                                    <th>Data Limite</th>
                                    <th>Meta (R$)</th>
                                    <th>Aporte (R$)</th>
                                    <th>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${linhasMetas || '<tr><td colspan="5" style="color:#888;">Sem metas cadastradas.</td></tr>'}
                            </tbody>
                        </table>
                    </div>`;
            }).join('');
        })
        .catch(error => {
            console.error('Erro ao carregar objetivos:', error);
        });
}

window.loadUserDetails = loadUserDetails;
