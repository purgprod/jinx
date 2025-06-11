function loadAssinaturasResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (centerPanel) {
        centerPanel.innerHTML = '';

        const formHTML = `
            <h2>Assinaturas</h2>
            <form id="financialDetailsForm">
                <table class="data-table">
                    <tr>
                        <td><label for="porcentagem">Porcentagem Cobrada na Assinatura (%):</label></td>
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
            <h2>Pagamento Total das Assinaturas</h2>
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Total Pago:</strong> R$ <span id="totalPagamentosAssinaturas">0,00</span></p>
                    </div>
                </div>
            </div>
            <h2>Histórico de Pagamentos das Assinaturas</h2>
            <canvas id="assinaturasHistoricosChart"></canvas>
            <h2>Histórico da Evolução dos Usuários por Planos</h2>
            <canvas id="planosHistoricosChart"></canvas>
        `;

        centerPanel.innerHTML = formHTML;

        // Busca os dados da API
        fetch('/api/assinaturas/buscar-porcentagem')
            .then(response => response.json())
            .then(data => {
                // Verifica se a resposta é um array e se o primeiro item tem a porcentagem
                if (Array.isArray(data) && data.length > 0 && data[0].porcentagem_assinatura) {
                    const porcentagem = parseFloat(data[0].porcentagem_assinatura);
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

        // Carrega e renderiza os dados históricos do pagamento das assinaturas
        loadPagamentoAssinaturasHistoricos()
            .then(dados => {
                renderizarGraficoPagamentoAssinaturasHistóricos(dados);
            })
            .catch(error => {
                console.error('Erro ao carregar ou renderizar dados históricos do pagamento das assinaturas:', error);
            });

	// Carrega e renderiza os dados históricos dos planos
        loadPlanosAssinaturasHistoricos()
            .then(dados => {
                renderizarGraficoPlanosAssinaturasHistóricos(dados);
            })
            .catch(error => {
                console.error('Erro ao carregar ou renderizar dados históricos dos planos:', error);
            });

        // Carrega os dados do total de pagamentos das assinaturas
        loadPagamentosAssinaturas();
    }
}

function setupEventListeners() {
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const valueElement = document.getElementById('porcentagem');

    if (editButton && saveButton && valueElement) {
        editButton.addEventListener('click', () => {
            // Torna o campo editável
            valueElement.removeAttribute('readonly');
            
            // Altera o estado dos botões
            editButton.style.display = 'none';
            saveButton.style.display = 'block';
        });

        saveButton.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Verifica se o valor é válido
            const novoValor = parseFloat(valueElement.value.replace('%', ''));
            if (!isNaN(novoValor)) {
                const porcentagem = novoValor.toFixed(2);
                valueElement.value = `${porcentagem}%`;
                
                // Atualiza a porcentagem na API
                fetch('/api/assinaturas/atualizar-porcentagem', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ porcentagem_assinatura: porcentagem }),
                })
                .then(response => {
                    if (response.ok) {
                        alert('Porcentagem atualizada com sucesso!');
                        // Atualiza a página após a atualização bem-sucedida
                        window.location.reload();
                    } else {
                        return response.json().then(data => Promise.reject(data));
                    }
                })
                .catch(error => {
                    console.error('Erro ao atualizar porcentagem:', error);
                    alert('Erro ao atualizar porcentagem');
                });
                
                // Torna o campo somente leitura novamente
                valueElement.setAttribute('readonly', true);
            }
        });

        // Esconde inicialmente o botão de salvar
        saveButton.style.display = 'none';
    }
}

// Função para carregar os pagamentos das assinaturas históricos
async function loadPagamentoAssinaturasHistoricos() {
    try {
        const response = await fetch(`/api/assinaturas/1/dados-pagamentos-assinaturas-historicos`);
        if (!response.ok) throw new Error('Erro ao buscar pagamentos das assinaturas históricos');
        const dados = await response.json();
        return dados;
    } catch (error) {
        console.error('Erro ao carregar dados de pagamento das assinaturas históricos:', error);
        throw error;
    }
}

function renderizarGraficoPagamentoAssinaturasHistóricos(dadosAssinaturasHistorico) {
    const canvas = document.getElementById('assinaturasHistoricosChart');
    if (!canvas) {
        console.error('Elemento canvas "assinaturasHistoricosChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    let assinaturasHistoricosChart; // Declaração da variável local

    const labels = dadosAssinaturasHistorico.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dadosAssinaturasHistorico.map(d => parseFloat(d.pagamento_assinatura));

    // Verifica se já existe um gráfico e o destroi
    if (window.assinaturasHistoricosChart instanceof Chart) {
        window.assinaturasHistoricosChart.destroy();
    }

    // Cria o novo gráfico
    window.assinaturasHistoricosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pagamento das Assinaturas (R$)',
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


function loadPagamentosAssinaturas() {
    return fetch(`/api/assinaturas/1/dados-pagamentos-assinaturas-total`)
        .then(response => response.ok ? response.json() : Promise.reject('Erro ao buscar saques'))
        .then(dadosPagamentosAssinaturas => {
            const totalPagamentosAssinaturasElement = document.getElementById('totalPagamentosAssinaturas');
            if (totalPagamentosAssinaturasElement) {
                // Verifica se os dados estão no formato correto
                if (Array.isArray(dadosPagamentosAssinaturas) && dadosPagamentosAssinaturas.length > 0) {
                    const valorBruto = dadosPagamentosAssinaturas[0].pagamento_assinatura || 0;
                    const valorFormatado = parseFloat(valorBruto).toFixed(8);
                    totalPagamentosAssinaturasElement.textContent = `${valorFormatado.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 8
                    })}`;
                } else {
                    totalPagamentosAssinaturasElement.textContent = 'R$ 0,00';
                    console.error('Resposta da API não está no formato esperado');
                }
            } else {
                console.error('Elemento totalPagamentosAssinaturas não encontrado no DOM.');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar pagamentos das assinaturas totais:', error);
            const totalPagamentosAssinaturasElement = document.getElementById('totalPagamentosAssinaturas');
            if (totalPagamentosAssinaturasElement) {
                totalPagamentosAssinaturasElement.textContent = 'R$ 0,00';
            }
        });
}

// Função para carregar os planos das assinaturas históricos
async function loadPlanosAssinaturasHistoricos() {
    try {
        const response = await fetch(`/api/assinaturas/dados-planos-assinaturas-historicos`);
        if (!response.ok) throw new Error('Erro ao buscar planos das assinaturas históricos');
        const dados = await response.json();
        return dados;
    } catch (error) {
        console.error('Erro ao carregar dados de planos das assinaturas históricos:', error);
        throw error;
    }
}

function renderizarGraficoPlanosAssinaturasHistóricos(dadosPlanosHistorico) {
    const canvas = document.getElementById('planosHistoricosChart');
    if (!canvas) {
        console.error('Elemento canvas "planosHistoricosChart" não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');
    let planosHistoricosChart; // Declaração da variável local

    const labels = dadosPlanosHistorico.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valoresBasic = dadosPlanosHistorico.map(d => parseFloat(d.poppy_basic));
    const valoresPro = dadosPlanosHistorico.map(d => parseFloat(d.poppy_pro));

    // Verifica se já existe um gráfico e o destroi
    if (window.planosHistoricosChart instanceof Chart) {
        window.planosHistoricosChart.destroy();
    }

    // Cria o novo gráfico com dois datasets
    window.planosHistoricosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Poppy Basic',
                    data: valoresBasic,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Poppy Pro',
                    data: valoresPro,
                    borderColor: 'rgba(160, 212, 124, 1)',
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Número de usuários' }
                },
                x: {
                    title: { display: true, text: 'Datas' }
                }
            }
        }
    });
}

// Torna a função acessível no escopo global
window.loadAssinaturasResults = loadAssinaturasResults;

