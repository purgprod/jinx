// Variável de controle para verificar se uma rotina está em execução
let rotinaEmExecucao = false;

// Função para formatar a data atual no timezone de São Paulo
function getDataFormatada() {
    const data = new Date();
    const options = {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Intl.DateTimeFormat('pt-BR', options).format(data);
}

// Carrega as rotinas do banco de dados e atualiza a tabela
async function loadRotinasResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (centerPanel) {
        // Limpa o conteúdo existente no centerPanel
        centerPanel.innerHTML = '';

        // Cria a tabela
        const table = document.createElement('table');
        table.classList.add('rotinas-table');

        // Cria o cabeçalho da tabela
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Rotina</th>
                <th>Hora Agendada</th>
                <th>Última Execução</th>
                <th>Status</th>
                <th>Executar</th>
            </tr>
        `;
        table.appendChild(thead);

        // Cria o corpo da tabela
        const tbody = document.createElement('tbody');

        try {
            // Busca as rotinas do banco de dados
            const response = await fetch('/api/rotinas');
            const rotinas = await response.json();

            // Adiciona cada rotina na tabela
            rotinas.forEach(rotina => {
                const dateOptions = {
                    timeZone: 'America/Sao_Paulo',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                const formattedDate = new Intl.DateTimeFormat('pt-BR', dateOptions).format(new Date(rotina.ultima_execucao));

                const status = rotina.status_execucao === 'SUCESSO' 
                    ? '<span style="color: green;">✓ Sucesso</span>' 
                    : rotina.status_execucao === 'FALHA' 
                        ? '<span style="color: red;">✗ Falha</span>' 
                        : '<span style="color: #D9AA1C;">⚠️ Pendente</span>';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${rotina.descricao}</td>
                    <td>${rotina.hora_agendada}</td>
                    <td>${formattedDate}</td>
                    <td>${status}</td>
                    <td>
                        <button onclick="executarRotina(${rotina.id}, '${rotina.descricao}')">
                            Executar
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            centerPanel.appendChild(table);

        } catch (error) {
            console.error('Erro ao carregar rotinas:', error);
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'Erro ao carregar as rotinas.';
            centerPanel.appendChild(errorMessage);
        }
    }
}

// Função para executar as rotinas
async function executarRotina(rotinaId, rotinaDescricao) {
    try {
        // Verifica se já existe uma rotina em execução
        if (rotinaEmExecucao) {
            alert('Uma rotina já está em execução. Por favor, aguarde.');
            return;
        }

        // Marca que uma rotina está em execução
        rotinaEmExecucao = true;

        // Verifica se a descrição da rotina está definida
        if (!rotinaDescricao) {
            alert('Erro: Descrição da rotina não identificada.');
            rotinaEmExecucao = false;
            return;
        }

        // Mostra no console a descrição recebida
        console.log('Descrição da rotina recebida:', rotinaDescricao);

        // Define os endpoints para executar após a rotina
        const endpointSucesso = `/api/rotinas/${rotinaId}/manutencao-status-execucao-sucesso`;
        const endpointFalha = `/api/rotinas/${rotinaId}/manutencao-status-execucao-falha`;
        const endpointAtualizarExecucao = `/api/rotinas/${rotinaId}/manutencao-atualizar-ultima-execucao`;

        let execucao;

        try {
            // Executa a rotina específica
            switch(rotinaDescricao) {
                case '[Manutenção] - Histórico do free float dos Pins':
                    execucao = await ManutencaoRotinaTokensHistoricoFreeFloat(rotinaId);
                    break;
                case '[Manutenção] - Histórico do valor investido e rendimentos por usuário':
                    execucao = await ManutencaoRotinaInvestimentoERendimento(rotinaId);
                    break;
                case '[Manutenção] - Checagem de Pins em modo sinistro':
                    execucao = await ManutencaoRotinaChecagemPinsSinistro(rotinaId);
                    break;
                case '[Manutenção] - Checagem de Resultados Financeiros vencidos':
                    execucao = await ManutencaoRotinaChecagemResultadosFinanceirosVencimento(rotinaId);
                    break;
                case '[Manutenção] - Atualizar o status execução para Pendente':
                    execucao = await ManutencaoUpdateStatusExecucaoPendente(rotinaId);
                    break;
                case '[Manutenção] - Atualizar o ranking dos usuários':
                    execucao = await ManutencaoRankingUsuarios(rotinaId);
                    break;
                case '[Manutenção] - Atualizar o sinistro dos usuários':
                    execucao = await ManutencaoSinistroUsuarios(rotinaId);
                    break;
                case '[Manutenção] - Histórico dos planos dos usuários':
                    execucao = await ManutencaoRotinaHistoricoPlanosUsuarios(rotinaId);
                    break;
                case '[Poppy] - Recompra de Pins em modo sinistro':
                    execucao = await PoppyRotinaRecompraPinsSinistro(rotinaId);
                    break;
                case '[Poppy] - Recompra de Pins vencidos':
                    execucao = await PoppyRotinaRecompraPinsVencidos(rotinaId);
                    break;
                case '[Poppy] - Pagamento dos rendimentos diário':
                    execucao = await PoppyRotinaPagamentoRendimentoDiario(rotinaId);
                    break;
                case '[Poppy] - Pagamento das assinaturas diário':
                    execucao = await PoppyRotinaPagamentoAssinaturaDiario(rotinaId);
                    break;
                case '[Poppy] - Compra diária de Pins':
                    execucao = await PoppyRotinaCompraDiariaPins(rotinaId);
                    break;
                case '[Poppy] - Pagamento dos emblemas diário':
                    execucao = await PoppyRotinaPagamentoEmblemaDiario(rotinaId);
                    break;
                default:
                    const cronRotinas = [
                        '[Manutenção] - Histórico do free float dos Pins',
                        '[Manutenção] - Histórico do valor investido e rendimentos por usuário',
                        '[Manutenção] - Checagem de Pins em modo sinistro',
                        '[Manutenção] - Checagem de Resultados Financeiros vencidos',
                        '[Manutenção] - Atualizar o status execução para Pendente',
                        '[Manutenção] - Atualizar o ranking dos usuários',
                        '[Manutenção] - Atualizar o sinistro dos usuários',
                        '[Manutenção] - Histórico dos planos dos usuários',
                        '[Poppy] - Recompra de Pins em modo sinistro',
                        '[Poppy] - Recompra de Pins vencidos',
                        '[Poppy] - Pagamento dos rendimentos diário',
                        '[Poppy] - Pagamento das assinaturas diário',
                        '[Poppy] - Compra diária de Pins',
                        '[Poppy] - Pagamento dos emblemas diário'
                    ];

                    if (!cronRotinas.includes(rotinaDescricao)) {
                        alert(`Atenção! Não existe uma rotina criada na cron do Node.js para "${rotinaDescricao}".`);
                        rotinaEmExecucao = false;
                        return;
                    }
                    break;
            }

            console.log('Valor de execucao:', execucao);

            if (execucao) {
                const responseSucesso = await fetch(endpointSucesso, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (responseSucesso.status === 200) {
                    const responseAtualizacao = await fetch(endpointAtualizarExecucao, {
                        method: 'PUT'
                    });

                    if (responseAtualizacao.status === 200) {
                        console.info('[Manutenção] - Execução finalizada com sucesso.');
                        loadRotinasResults();
                    } else {
                        console.error('[Manutenção] - Erro ao atualizar a última execução.');
                        throw new Error('Erro ao atualizar a última execução.');
                    }
                } else {
                    console.error('[Manutenção] - Erro ao executar endpoint de sucesso.');
                    throw new Error('Erro ao executar endpoint de sucesso.');
                }
            } else {
                const responseFalha = await fetch(endpointFalha, {
                    method: 'POST'
                });

                if (responseFalha.status === 200) {
                    console.info('[Manutenção] - Status atualizado com sucesso.');
                    loadRotinasResults();
                } else {
                    console.error('[Manutenção] - Erro ao executar endpoint de falha.');
                    throw new Error('Erro ao executar endpoint de falha.');
                }
            }

        } catch (error) {
            console.error('Erro ao executar rotina:', error);
            alert('[Manutenção] - Erro ao executar a rotina. Detalhes: ' + error.message);
        }

        // Libera a execução para outras rotinas
        rotinaEmExecucao = false;

    } catch (error) {
        console.error('Erro ao executar rotina:', error);
        alert('[Manutenção] - Erro ao executar a rotina. Detalhes: ' + error.message);
        rotinaEmExecucao = false;
    }
}

//----------------------------------------------
// ROTINAS EXCLUSIVAS DE MANUTENÇÃO DO ECOSSISTEMA
// ---------------------------------------------

// Função para executar a rotina de histórico do free float e executar rotina específica
async function ManutencaoRotinaTokensHistoricoFreeFloat(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/tokens-historico-free-float', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Manutenção] - Rotina de histórico do free float executada com sucesso');
            return true;
        } else {
            console.error('[Manutenção] - Erro ao executar rotina de histórico do free float:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Manutenção] - Erro ao executar rotina de histórico do free float:', error);
        return false;
    }
}

async function ManutencaoRotinaInvestimentoERendimento(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/investimento-rendimento-historico', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Manutenção] - Rotina de histórico de investimentos e rendimentos executada com sucesso');
            return true;
        } else {
            console.error('[Manutenção] - Erro ao executar rotina de histórico de investimentos e rendimentos:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Manutenção] - Erro ao executar rotina de histórico de investimentos e rendimentos:', error);
        return false;
    }
}

async function ManutencaoRotinaChecagemPinsSinistro(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/checagem-pins-sinistro', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Manutenção] - Rotina para inativar pins em modo sinistro executada com sucesso');
            return true;
        } else {
            console.error('[Manutenção] - Erro ao executar rotina para inativar pins em modo sinistro:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Manutenção] - Erro ao executar rotina para inativar pins em modo sinistro:', error);
        return false;
    }
}

async function ManutencaoRotinaChecagemResultadosFinanceirosVencimento(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/manutencao-inativar-resultado-financeiro-vencido', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Manutenção] - Rotina para inativar resultados financeiros vencidos executada com sucesso');
            return true;
        } else {
            console.error('[Manutenção] - Erro ao executar rotina para inativar resultados financeiros vencidos:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Manutenção] - Erro ao executar rotina para inativar resultados financeiros vencidos:', error);
        return false;
    }
}

async function ManutencaoUpdateStatusExecucaoPendente(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/manutencao-update-status-execucao-pendente', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Manutenção] - Rotina para fazer update em todas as rotinas para status_execucao Pendente executada com sucesso');
            return true;
        } else {
            console.error('[Manutenção] - Erro ao executar rotina para fazer update em todas as rotinas para status_execucao Pendente:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Manutenção] - Erro ao executar rotina para update em todas as rotinas para status_execuço Pendente:', error);
        return false;
    }
}

async function ManutencaoRankingUsuarios(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/manutencao-ranking-usuarios', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Manutenção] - Rotina para fazer o ranking dos usuários executada com sucesso');
            return true;
        } else {
            console.error('[Manutenção] - Erro ao executar rotina para fazer o ranking dos usuários:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Manutenção] - Erro ao executar rotina para fazer o ranking dos usuários:', error);
        return false;
    }
}

async function ManutencaoSinistroUsuarios(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/manutencao-sinistro-usuarios', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Manutenção] - Rotina para fazer o sinistro dos usuários executada com sucesso');
            return true;
        } else {
            console.error('[Manutenção] - Erro ao executar rotina para fazer o sinistro dos usuários:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Manutenção] - Erro ao executar rotina para fazer o sinistro dos usuários:', error);
        return false;
    }
}

async function ManutencaoRotinaHistoricoPlanosUsuarios(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/manutencao-planos-assinaturas-historico', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Manutenção] - Rotina para gravar o histórico dos planos dos usuários executada com sucesso');
            return true;
        } else {
            console.error('[Manutenção] - Erro ao executar rotina para gravar o histórico dos planos dos usuários:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Manutenção] - Erro ao executar rotina para gravar o histórico dos planos dos usuários:', error);
        return false;
    }
}

//----------------------------------------------
// ROTINAS EXCLUSIVAS DA POPPY
// ---------------------------------------------

async function PoppyRotinaRecompraPinsSinistro(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/poppy-recompra-pins-sinistro', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Poppy] - Rotina para recompra de pins em modo sinistro executada com sucesso');
            return true;
        } else {
            console.error('[Poppy] - Erro ao executar rotina para recompra de pins em modo sinistro:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Poppy] - Erro ao executar rotina para recompra pins em modo sinistro:', error);
        return false;
    }
}

async function PoppyRotinaRecompraPinsVencidos(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/poppy-recompra-pins-vencidos', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Poppy] - Rotina para recompra de pins vencidos executada com sucesso');
            return true;
        } else {
            console.error('[Poppy] - Erro ao executar rotina para recompra de pins vencidos:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Poppy] - Erro ao executar rotina para recompra pins vencidos:', error);
        return false;
    }
}

async function PoppyRotinaPagamentoRendimentoDiario(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/poppy-pagamento-rendimento-diario', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Poppy] - Rotina para pagamento dos rendimentos diários executada com sucesso');
            return true;
        } else {
            console.error('[Poppy] - Erro ao executar rotina para pagamento dos rendimentos diários:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Poppy] - Erro ao executar rotina para pagamento dos rendimentos diários:', error);
        return false;
    }
}

async function PoppyRotinaPagamentoAssinaturaDiario(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/poppy-pagamento-assinatura-diario', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Poppy] - Rotina para pagamento das assinaturas diários executada com sucesso');
            return true;
        } else {
            console.error('[Poppy] - Erro ao executar rotina para pagamento das assinaturas diários:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Poppy] - Erro ao executar rotina para pagamento das assinaturas diários:', error);
        return false;
    }
}

async function PoppyRotinaCompraDiariaPins(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/poppy-compra-diaria-pins', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Poppy] - Rotina para compra diária de Pins executada com sucesso');
            return true;
        } else {
            console.error('[Poppy] - Erro ao executar rotina para compra diária de Pins:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Poppy] - Erro ao executar rotina para compra diária de Pins:', error);
        return false;
    }
}

async function PoppyRotinaPagamentoEmblemaDiario(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/poppy-pagamento-emblema-diario', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('[Poppy] - Rotina para pagamento das assinaturas diários executada com sucesso');
            return true;
        } else {
            console.error('[Poppy] - Erro ao executar rotina para pagamento das assinaturas diários:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('[Poppy] - Erro ao executar rotina para pagamento das assinaturas diários:', error);
        return false;
    }
}

// Torna as funções acessíveis no escopo global
window.loadRotinasResults = loadRotinasResults;
window.executarRotina = executarRotina;
window.ManutencaoRotinaTokensHistoricoFreeFloat = ManutencaoRotinaTokensHistoricoFreeFloat;
window.ManutencaoRotinaInvestimentoERendimento = ManutencaoRotinaInvestimentoERendimento;
window.ManutencaoRotinaChecagemPinsSinistro = ManutencaoRotinaChecagemPinsSinistro;
window.ManutencaoRotinaChecagemResultadosFinanceirosVencimento = ManutencaoRotinaChecagemResultadosFinanceirosVencimento;
window.ManutencaoUpdateStatusExecucaoPendente = ManutencaoUpdateStatusExecucaoPendente;
window.ManutencaoRankingUsuarios = ManutencaoRankingUsuarios;
window.ManutencaoSinistroUsuarios = ManutencaoSinistroUsuarios;
window.ManutencaoRotinaHistoricoPlanosUsuarios = ManutencaoRotinaHistoricoPlanosUsuarios;
window.PoppyRotinaRecompraPinsSinistro = PoppyRotinaRecompraPinsSinistro;
window.PoppyRotinaRecompraPinsVencidos = PoppyRotinaRecompraPinsVencidos;
window.PoppyRotinaPagamentoRendimentoDiario = PoppyRotinaPagamentoRendimentoDiario;
window.PoppyRotinaPagamentoAssinaturaDiario = PoppyRotinaPagamentoAssinaturaDiario;
window.PoppyRotinaCompraDiariaPins = PoppyRotinaCompraDiariaPins;
window.PoppyRotinaPagamentoEmblemaDiario = PoppyRotinaPagamentoEmblemaDiario;

