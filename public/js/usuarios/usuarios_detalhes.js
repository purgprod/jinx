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
                <h3>Suitability</h3>
                <form id="suitabilityDetailsForm">
                    ${generateSuitabilitySection(data)}
                </form>
                <h3>Tokens do Usuário</h3>
                <div id="tokensContainer" class="cards-container"></div>
            `;

            setupEventListenersUsuarios(usuario_id);
            // Chama a função para carregar os dados da seção suitability
            loadSuitability(usuario_id);  

            // Funções para carregar dados financeiros e tokens
            Promise.all([
                loadUserTokens(usuario_id), 
                loadUltimosDadosFinanceiros(usuario_id),
                loadDadosFinanceirosHistoricos(usuario_id), 
                loadDadosRendimentosHistoricos(usuario_id) 
            ]).then(() => {
                return loadSaques(usuario_id);
            }).then(() => {
                console.log("Todas as chamadas de API foram completadas.");
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

// Função para gerar a nova seção de Suitability
function generateSuitabilitySection(data) {
    return `
        <label for="qual_objetivo">Qual o seu principal objetivo ao investir seu dinheiro?</label>
        <input type="number" id="qual_objetivo" name="qual_objetivo" value="${data.qual_objetivo ?? ''}" readonly>
        
        <label for="quanto_tempo">Por quanto tempo pretende deixar seu dinheiro investido?</label>
        <input type="number" id="quanto_tempo" name="quanto_tempo" value="${data.quanto_tempo ?? ''}" readonly>
        
        <label for="qual_necessidade">Qual é a sua necessidade em relação ao dinheiro que está investindo?</label>
        <input type="number" id="qual_necessidade" name="qual_necessidade" value="${data.qual_necessidade ?? ''}" readonly>
        
        <label for="qual_percentual">Qual percentual da sua renda você investe regularmente?</label>
        <input type="number" id="qual_percentual" name="qual_percentual" value="${data.qual_percentual ?? ''}" readonly>
        
        <label for="oscilacoes_mercado">Por conta de oscilações do mercado, o que você faria?</label>
        <input type="number" id="oscilacoes_mercado" name="oscilacoes_mercado" value="${data.oscilacoes_mercado ?? ''}" readonly>
        
        <label for="formacao">Considerando sua formação, é possível afirmar que:</label>
        <input type="number" id="formacao" name="formacao" value="${data.formacao ?? ''}" readonly>
        
        <label for="experiencia">Considerando sua experiência profissional, é possível afirmar que:</label>
        <input type="number" id="experiencia" name="experiencia" value="${data.experiencia ?? ''}" readonly>
        
        <label for="expectativa_5_anos">Como você descreveria sua expectativa de renda futura para os próximos 5 anos?</label>        
        <input type="number" id="expectativa_5_anos" name="expectativa_5_anos" value="${data.expectativa_5_anos ?? ''}" readonly>
        
        <label for="operacoes_derivativos">Pretende realizar operações com derivativos?</label>
        <input type="number" id="operacoes_derivativos" name="operacoes_derivativos" value="${data.operacoes_derivativos ?? ''}" readonly>
        
        <label for="volume_frequencia_renda_fixa_basica">Volume e frequência de operações em Renda fixa Básica:</label>
        <input type="number" id="volume_frequencia_renda_fixa_basica" name="volume_frequencia_renda_fixa_basica" value="${data.volume_frequencia_renda_fixa_basica ?? ''}" readonly>

        <label for="volume_frequencia_outros">Volume e frequência de operações em Debêntures e outros fundos:</label>
        <input type="number" id="volume_frequencia_outros" name="volume_frequencia_outros" value="${data.volume_frequencia_outros ?? ''}" readonly>

        <label for="volume_frequencia_renda_variavel_basica">Volume e frequência de operações em Renda variável básica:</label>
        <input type="number" id="volume_frequencia_renda_variavel_basica" name="volume_frequencia_renda_variavel_basica" value="${data.volume_frequencia_renda_variavel_basica ?? ''}" readonly>

        <label for="volume_frequencia_derivativos">Volume e frequência de operações em Derivativos:</label>
        <input type="number" id="volume_frequencia_derivativos" name="volume_frequencia_derivativos" value="${data.volume_frequencia_derivativos ?? ''}" readonly>

       <label for="percentual_aproximado_renda_fixa">Qual o percentual aproximado de seus investimentos em Renda Fixa Básica?</label>
        <input type="text" id="percentual_aproximado_renda_fixa" name="percentual_aproximado_renda_fixa" value="${data.percentual_aproximado_renda_fixa != null ? (parseFloat(data.percentual_aproximado_renda_fixa).toFixed(0) + '%') : ''}" readonly>

        <label for="percentual_aproximado_outros">Qual o percentual aproximado de seus investimentos em Debêntures e outros fundos?</label>
        <input type="text" id="percentual_aproximado_outros" name="percentual_aproximado_outros" value="${data.percentual_aproximado_outros != null ? (parseFloat(data.percentual_aproximado_outros).toFixed(0) + '%') : ''}" readonly>

        <label for="percentual_aproximado_renda_variavel">Qual o percentual aproximado de seus investimentos em Renda Variável Básica?</label>
        <input type="text" id="percentual_aproximado_renda_variavel" name="percentual_aproximado_renda_variavel" value="${data.percentual_aproximado_renda_variavel != null ? (parseFloat(data.percentual_aproximado_renda_variavel).toFixed(0) + '%') : ''}" readonly>

        <label for="percentual_aproximado_derivatios">Qual o percentual aproximado de seus investimentos em Derivativos?</label>
        <input type="text" id="percentual_aproximado_derivatios" name="percentual_aproximado_derivatios" value="${data.percentual_aproximado_derivatios != null ? (parseFloat(data.percentual_aproximado_derivatios).toFixed(0) + '%') : ''}" readonly>
    `;
}

// Função para carregar as informações de suitability
function loadSuitability(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/suitability`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados de suitability');
            }
            return response.json();
        })
        .then(suitabilityData => {
            console.log('Suitability Data:', suitabilityData); // Adicione este log para verificar os dados retornados
            const suitabilityInputs = document.querySelectorAll('#suitabilityDetailsForm input');
            suitabilityInputs.forEach(input => {
                const key = input.name; // Chave para encontrar o valor no objeto suitabilityData
                if (suitabilityData[0][key] !== undefined) { // Acessar suitabilityData[0] porque é um array
                    input.value = suitabilityData[0][key]; // Atualiza o campo com o valor
                }
            });
        })
        .catch(error => {
            console.error('Erro ao carregar dados de suitability:', error);
        });
}

// Função que busca e exibe os tokens do usuário
function loadUserTokens(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/tokens`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar tokens');
            }
            return response.json();
        })
        .then(tokens => {
            const tokensContainer = document.getElementById('tokensContainer');
            if (tokensContainer) {
                tokensContainer.innerHTML = tokens.map(createTokenCardHTML).join('');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar tokens do usuário:', error);
        });
}

// Função que busca e exibe os últimos dados financeiros do usuário
function loadUltimosDadosFinanceiros(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/ultimos-dados-financeiros`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar últimos dados financeiros');
            }
            return response.json();
        })
        .then(dados => {
            console.log('Últimos dados financeiros:', dados); // Log dos dados
            displayUltimosDadosFinanceiros(dados, usuario_id);
        })
        .catch(error => {
            console.error('Erro ao carregar últimos dados financeiros:', error);
        });
}

// Função para exibir os últimos dados financeiros da carteira em formato de card
function displayUltimosDadosFinanceiros(dados, usuario_id) {
    const carteiraContainer = document.getElementById('carteiraContainer');
    if (carteiraContainer) {
        carteiraContainer.innerHTML = `
            <h3>Dados Financeiros</h3>
            <div class="cards-basico"> <!-- Usando a nova classe aqui -->
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
            </div>
            <canvas id="carteiraChart"></canvas>
            <canvas id="carteiraRendimentosChart"></canvas>
        `;
    }
}

// Função para carregar e exibir os saques do usuário
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
            const totalSaque = dadosSaques['SUM(valor_saque)'] || 0; // Verifica se existe a soma
            totalSaqueElement.textContent = parseFloat(totalSaque).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        })
        .catch(error => {
            console.error('Erro ao carregar saques do usuário:', error);
        });
}

// Função que busca e exibe os dados financeiros históricos do usuário
function loadDadosFinanceirosHistoricos(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/dados-financeiros-historicos`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados financeiros históricos');
            }
            return response.json();
        })
        .then(dados => {
            console.log('Dados financeiros históricos:', dados); // Log dos dados
            // Adicionando timeout aqui para garantir que o canvas esteja disponível
            setTimeout(() => {
                renderizarGrafico(dados);
            }, 100); // Delay de 100 ms, ajuste se necessário
        })
        .catch(error => {
            console.error('Erro ao carregar dados financeiros históricos:', error);
        });
}

// Função para renderizar o gráfico com os dados financeiros
let carteiraChart;

function renderizarGrafico(dados) {
    const canvas = document.getElementById('carteiraChart');
    if (!canvas) {
        console.error('Elemento canvas "carteiraChart" não encontrado.');
        return; // Encerra a função se o canvas não existir
    }

    const ctx = canvas.getContext('2d');

    // Verificar se já existe um gráfico e destruí-lo
    if (carteiraChart) {
        carteiraChart.destroy();
    }

    const labels = dados.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dados.map(d => parseFloat(d.carteira_dia));

    if (valores.length === 0) {
        console.error('Nenhum valor encontrado para o gráfico de carteira.');
        return; // Saia se não houver valores
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

// Função que busca e exibe os dados de rendimentos históricos do usuário
function loadDadosRendimentosHistoricos(usuario_id) {
    return fetch(`/api/usuarios/${usuario_id}/dados-financeiros-rendimentos-historicos`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados de rendimentos históricos');
            }
            return response.json();
        })
        .then(dados => {
            console.log('Dados de rendimentos históricos:', dados); // Log dos dados
            // Adicionando timeout aqui para garantir que o canvas esteja disponível
            setTimeout(() => {
                renderizarGraficoRendimentos(dados);
            }, 100); // Delay de 100 ms, ajuste se necessário
        })
        .catch(error => {
            console.error('Erro ao carregar dados de rendimentos históricos:', error);
        });
}

// Função para renderizar o gráfico com os dados de rendimentos
let carteiraRendimentosChart;

function renderizarGraficoRendimentos(dados) {
    const canvas = document.getElementById('carteiraRendimentosChart');
    if (!canvas) {
        console.error('Elemento canvas "carteiraRendimentosChart" não encontrado.');
        return; // Encerra a função se o canvas não existir
    }

    const ctx = canvas.getContext('2d');

    // Verifica se já existe um gráfico e o destrói
    if (carteiraRendimentosChart) {
        carteiraRendimentosChart.destroy();
    }

    // Extraindo labels e valores
    const labels = dados.map(d => new Date(d.data_criacao).toLocaleDateString());
    const valores = dados.map(d => parseFloat(d.rendimento_dia)); // Usando parseFloat para garantir que os valores são numéricos

    if (valores.length === 0) {
        console.error('Nenhum valor encontrado para o gráfico de rendimentos.'); // Mensagem de erro
        return; // Encerra a função se não houver valores
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

// Função para gerar o HTML para um cartão de token
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

// Função que gera HTML para os campos de entrada baseado nos dados do usuário
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

// Organiza os eventos dos botões
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
                    return response.json(); // Aguarda o retorno JSON
                } else {
                    throw new Error('Erro ao atualizar o usuário.');
                }
            })
            .then(data => {
                // Verifica se a atualização realmente mudou algo
                if (data.changedRows === 0) {
                    alert('Nenhuma alteração foi feita nos dados do usuário. Verifique os valores informados.');
                } else {
                    alert('Usuário atualizado com sucesso!');
                    refreshPage(); // Recarrega a página após a atualização
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

// Função para recarregar a página
function refreshPage() {
    location.reload(); // Recarrega a página inteira
}

// Configura botão para ativar/inativar
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
                        refreshPage(); // Recarrega a página após a ativação/inativação
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

// Você deve garantir que resetarSenha está acessível globalmente
function resetarSenha(usuario_id) {
    // Enviar requisição para redefinir a senha do usuário
    fetch(`/api/usuarios/${usuario_id}/resetar-senha`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Senha redefinida com sucesso!');
            location.reload(); // Recarrega a página
        } else {
            alert('Erro ao redefinir a senha.');
        }
    })
    .catch(error => {
        console.error('Erro ao redefinir a senha:', error);
        alert('Erro ao redefinir a senha.');
    });
}

