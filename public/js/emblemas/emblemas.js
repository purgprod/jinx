function loadEmblemasResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (centerPanel) {
        centerPanel.innerHTML = '';

        const formHTML = `
            <h2>Emblemas</h2>
            <form id="financialDetailsForm">
                <table class="data-table">
                    <tr>
                        <td><label for="porcentagem">Porcentagem paga em Emblemas sobre o saldo (%):</label></td>
                        <td>
                            <input type="text" 
                                   id="porcentagem" 
                                   name="porcentagem" 
                                   value="Carregando..." 
                                   readonly>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <div class="button-container">
                                <button type="button" id="editButton" class="button-azul">Editar</button>
                                <button type="submit" id="saveButton" class="button-azul">Salvar</button>
                            </div>
                        </td>
                    </tr>
                </table>
            </form>
	    <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Total de Emblemas no ecossistema</strong> R$ <span id="totalEmblemas">0,00</span></p>
                    </div>
                </div>
            </div>
            <h2>Histórico dos Emblemas no Ecossistema</h2>
            <canvas id="emblemasTotalHistoricosChart"></canvas>
            <h2>Pagamento Histórico dos Emblemas</h2>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Total pago em Emblemas para o ecossistema:</strong> R$ <span id="totalPagamentosEmblemas">0,00</span></p>
                    </div>
                </div>
            </div>
            <h2>Histórico de Pagamentos dos Emblemas</h2>
            <canvas id="emblemasPagamentoHistoricosChart"></canvas>
                </div>
            </div>
        `;

        centerPanel.innerHTML = formHTML;

        // Busca os dados da API
        fetch('/api/emblemas/buscar-porcentagem')
            .then(response => response.json())
            .then(data => {
                console.log('Dados recebidos de /api/emblemas/buscar-porcentagem:', data);
                if (Array.isArray(data) && data.length > 0 && data[0].porcentagem_emblemas) {
                    const porcentagem = parseFloat(data[0].porcentagem_emblemas);
                    const valueElement = document.getElementById('porcentagem');
                    if (valueElement) {
                        valueElement.value = `${porcentagem.toFixed(2)}%`;
                    }
                } else {
                    console.error('Resposta da API não está no formato esperado');
                    const valueElement = document.getElementById('porcentagem');
                    if (valueElement) {
                        valueElement.value = 'Dados não disponíveis';
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao buscar porcentagem:', error);
                const valueElement = document.getElementById('porcentagem');
                if (valueElement) {
                    valueElement.value = 'Erro ao carregar dados';
                }
            });

        // Configura os botões Editar e Salvar
        setupEventListeners();

        // Carrega e renderiza os dados históricos do pagamento dos emblemas
        loadPagamentoEmblemasHistoricos()
            .then(dados => {
                console.log('Dados recebidos de loadPagamentoEmblemasHistoricos:', dados);
                renderizarGraficoPagamentoEmblemasHistóricos(dados);
            })
            .catch(error => {
                console.error('Erro ao carregar ou renderizar dados históricos do pagamento dos emblemas:', error);
            });

        // Carrega os dados do total de emblemas
        loadTotalEmblemas();
        
	// Carrega os dados do pagamento total de emblemas
        loadPagamentosEmblemas();
        
        // Carrega e renderiza os dados históricos do total de emblemas
        loadEmblemasHistoricos()
            .then(dados => {
                console.log('Dados recebidos de loadEmblemasHistoricos:', dados);
                renderizarGraficoEmblemasHistoricos(dados);
            })
            .catch(error => {
                console.error('Erro ao carregar ou renderizar dados históricos do total de emblemas:', error);
            });

    }
}

function setupEventListeners() {
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const valueElement = document.getElementById('porcentagem');

    if (editButton && saveButton && valueElement) {
        editButton.addEventListener('click', () => {
            valueElement.removeAttribute('readonly');
            editButton.style.display = 'none';
            saveButton.style.display = 'block';
        });

        saveButton.addEventListener('click', (event) => {
            event.preventDefault();
            const novoValor = parseFloat(valueElement.value.replace('%', ''));
            if (!isNaN(novoValor)) {
                const porcentagem = novoValor.toFixed(2);
                valueElement.value = `${porcentagem}%`;
                
                fetch('/api/emblemas/atualizar-porcentagem', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ porcentagem_emblemas: porcentagem }),
                })
                .then(response => {
                    if (response.ok) {
                        alert('Porcentagem atualizada com sucesso!');
                        window.location.reload();
                    } else {
                        return response.json().then(data => Promise.reject(data));
                    }
                })
                .catch(error => {
                    console.error('Erro ao atualizar porcentagem:', error);
                    alert('Erro ao atualizar porcentagem');
                });
                
                valueElement.setAttribute('readonly', true);
            }
        });

        saveButton.style.display = 'none';
    }
}

function loadTotalEmblemas() {
    return fetch(`/api/emblemas/1/dados-emblemas-total`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar emblemas'))
        .then(dadosTotalEmblemas => {
            console.log('Dados recebidos de /api/emblemas/1/dados-emblemas-total:', dadosTotalEmblemas);
            const totalEmblemasElement = document.getElementById('totalEmblemas');
            if (totalEmblemasElement) {
                if (Array.isArray(dadosTotalEmblemas) && dadosTotalEmblemas.length > 0) {
                    const valorBruto = dadosTotalEmblemas[0].emblemas || 0;                    const valorFormatado = parseFloat(valorBruto).toFixed(8);
                    totalEmblemasElement.textContent = `${valorFormatado.toLocaleString('pt-BR', { minimumFractionDigits: 8 })}`;
                } else {
                    totalEmblemasElement.textContent = 'R$ 0,00';
                    console.error('Resposta da API não está no formato esperado');
                }
            } else {
                console.error('Elemento totalEmblemas não encontrado no DOM.');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar emblemas totais:', error);
            const totalEmblemasElement = document.getElementById('totalEmblemas');
            if (totalEmblemasElement) {
                totalEmblemasElement.textContent = 'R$ 0,00';
            }
        });
}

function loadPagamentosEmblemas() {
    return fetch(`/api/emblemas/1/dados-pagamentos-emblemas-total`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar emblemas'))
        .then(dadosPagamentosEmblemas => {
            console.log('Dados recebidos de /api/emblemas/1/dados-pagamentos-emblemas-total:', dadosPagamentosEmblemas);
            const totalPagamentosEmblemasElement = document.getElementById('totalPagamentosEmblemas');
            if (totalPagamentosEmblemasElement) {
                if (Array.isArray(dadosPagamentosEmblemas) && dadosPagamentosEmblemas.length > 0) {
                    const valorBruto = dadosPagamentosEmblemas[0].pagamento_emblemas || 0;
                    const valorFormatado = parseFloat(valorBruto).toFixed(8);
                    totalPagamentosEmblemasElement.textContent = `${valorFormatado.toLocaleString('pt-BR', { minimumFractionDigits: 8 })}`;
                } else {
                    totalPagamentosEmblemasElement.textContent = 'R$ 0,00';
                    console.error('Resposta da API não está no formato esperado');
                }
            } else {
                console.error('Elemento totalPagamentosEmblemas não encontrado no DOM.');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar pagamentos dos emblemas totais:', error);
            const totalPagamentosEmblemasElement = document.getElementById('totalPagamentosEmblemas');
            if (totalPagamentosEmblemasElement) {
                totalPagamentosEmblemasElement.textContent = 'R$ 0,00';
            }
        });
}

function loadPagamentoEmblemasHistoricos() {
    return fetch(`/api/emblemas/1/dados-pagamentos-emblemas-historicos`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao buscar pagamentos dos emblemas históricos');
            return response.json();
        })
        .then(dados => {
            console.log('Dados retornados por /api/emblemas/1/dados-pagamentos-emblemas-historicos:', dados);
            return dados;
        })
        .catch(error => {
            console.error('Erro ao carregar dados de pagamento dos emblemas históricos:', error);
            throw error;
        });
}

function renderizarGraficoPagamentoEmblemasHistóricos(dadosEmblemasHistorico) {
    console.log('Dados recebidos por renderizarGraficoPagamentoEmblemasHistóricos:', dadosEmblemasHistorico);
    const canvas = document.getElementById('emblemasPagamentoHistoricosChart');
    if (!canvas) {
        console.error('Elemento canvas "emblemasPagamentoHistoricosChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    let emblemasPagamentoHistoricosChart;

    const labels = dadosEmblemasHistorico.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dadosEmblemasHistorico.map(d => parseFloat(d.pagamento_emblemas));

    console.log('Labels:', labels);
    console.log('Valores:', valores);

    if (window.emblemasPagamentoHistoricosChart instanceof Chart) {
        window.emblemasPagamentoHistoricosChart.destroy();
    }

    window.emblemasPagamentoHistoricosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pagamento dos Emblemas (R$)',
                data: valores,
                borderColor: 'rgba(160, 212, 124, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                    title: { display: true, text: 'Valor em R$' }
                },
                x: {
                    title: { display: true, text: 'Datas' }
                }
            }
        }
    });
}

function loadEmblemasHistoricos() {
    return fetch(`/api/emblemas/1/dados-emblemas-totais-historicos`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar dados dos emblemas totais históricos'))
        .then(dados => {
            console.log('Dados retornados por /api/emblemas/1/dados-emblemas-totais-historicos:', dados);
            return dados;
        })
        .catch(error => console.error('Erro ao carregar emblemas totais históricos:', error));
}

function renderizarGraficoEmblemasHistoricos(dadosEmblemasHistoricos) {
    console.log('Dados recebidos por renderizarGraficoEmblemasHistoricos:', dadosEmblemasHistoricos);
    const canvas = document.getElementById('emblemasTotalHistoricosChart');
    if (!canvas) {
        console.error('Elemento canvas "emblemasTotalHistoricosChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    let emblemasTotalHistoricosChart;

    const labels = dadosEmblemasHistoricos.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dadosEmblemasHistoricos.map(d => parseFloat(d.emblemas_dia));

    console.log('Labels:', labels);
    console.log('Valores:', valores);

    if (window.emblemasTotalHistoricosChart instanceof Chart) {
        window.emblemasTotalHistoricosChart.destroy();
    }

    window.emblemasTotalHistoricosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total de Emblemas por dia (R$)',
                data: valores,
                borderColor: 'rgba(160, 212, 124, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                    title: { display: true, text: 'Valor em R$' }
                },
                x: {
                    title: { display: true, text: 'Datas' }
                }
            }
        }
    });
}


// Torna as funções acessíveis no escopo global
window.loadEmblemasResults = loadEmblemasResults;

