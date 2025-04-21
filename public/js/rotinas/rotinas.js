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
              //    timeZone: 'UTC',
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
                        : '<span style="color: yellow;">⚠️ Pendente</span>';

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
        // Verifica se a descrição da rotina está definida
        if (!rotinaDescricao) {
            alert('Erro: Descrição da rotina não identificada.');
            return;
        }

        // Mostra no console a descrição recebida
        console.log('Descrição da rotina recebida:', rotinaDescricao);

	if (rotinaDescricao === 'Histórico do free float dos Pins') {
	    await RotinaTokensHistoricoFreeFloat(rotinaId);
	} else if (rotinaDescricao === 'Histórico do valor investido e rendimentos por usuário') {
	    await RotinaInvestimentoERendimento(rotinaId);
	} else if (rotinaDescricao === 'Checagem de Pins em modo sinistro') {
	    await RotinaChecagemPinsSinistro(rotinaId);
	} else if (rotinaDescricao === 'Recompra de Pins em modo sinistro') {
	    await RotinaRecompraPinsSinistro(rotinaId);
	} else {
	    // Verifica se existe uma rotina criada na cron do Node.js
	    const cronRotinas = [
	        'Histórico do free float dos Pins',
	        'Histórico do valor investido e rendimentos por usuário',
	        'Checagem de Pins em modo sinistro',
	        'Recompra de Pins em modo sinistro'
	    ];

	    if (!cronRotinas.includes(rotinaDescricao)) {
	        alert(`Atenção! Não existe uma rotina criada na cron do Node.js para "${rotinaDescricao}".`);
	        return;
	    }
	}
            const dataAgora = getDataFormatada();

            // Executa a rotina específica
            const rotinaResponse = await fetch(`/api/rotinas/${rotinaId}/executar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (rotinaResponse.ok) {
                // Atualiza a ultima_execucao
                await fetch(`/api/rotinas/${rotinaId}/atualizar-execucao`, {
                    method: 'PUT'
                });

                // Atualiza a tabela
                loadRotinasResults();
            } else {
                throw new Error('Erro ao executar rotina específica');
            }
        
    } catch (error) {
        console.error('Erro ao executar rotina:', error);
        alert('Erro ao executar a rotina. Detalhes: ' + error.message);
    }
}


// Função para executar a rotina de histórico do free float e executar rotina específica
async function RotinaTokensHistoricoFreeFloat(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/tokens-historico-free-float', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('Rotina de histórico do free float executada com sucesso');
            return true;
        } else {
            console.error('Erro ao executar rotina de histórico do free float:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Erro ao executar rotina de histórico do free float:', error);
        return false;
    }
}

async function RotinaInvestimentoERendimento(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/investimento-rendimento-historico', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('Rotina de histórico de investimentos e rendimentos executada com sucesso');
            return true;
        } else {
            console.error('Erro ao executar rotina de histórico de investimentos e rendimentos:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Erro ao executar rotina de histórico de investimentos e rendimentos:', error);
        return false;
    }
}

async function RotinaChecagemPinsSinistro(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/checagem-pins-sinistro', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('Rotina para inativar pins em modo sinistro executada com sucesso');
            return true;
        } else {
            console.error('Erro ao executar rotina para inativar pins em modo sinistro:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Erro ao executar rotina para inativar pins em modo sinistro:', error);
        return false;
    }
}

async function RotinaRecompraPinsSinistro(rotinaId) {
    try {
        const response = await fetch('/api/rotinas/recompra-pins-sinistro', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('Rotina para recompra de pins em modo sinistro executada com sucesso');
            return true;
        } else {
            console.error('Erro ao executar rotina para recompra de pins em modo sinistro:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Erro ao executar rotina para recompra pins em modo sinistro:', error);
        return false;
    }
}


// Torna as funções acessíveis no escopo global
window.loadRotinasResults = loadRotinasResults;
window.executarRotina = executarRotina;
window.RotinaTokensHistoricoFreeFloat = RotinaTokensHistoricoFreeFloat;
window.RotinaInvestimentoERendimento = RotinaInvestimentoERendimento;
window.RotinaChecagemPinsSinistro = RotinaChecagemPinsSinistro;
window.RotinaRecompraPinsSinistro = RotinaRecompraPinsSinistro;
