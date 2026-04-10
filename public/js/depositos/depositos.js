// public/js/depositos/depositos.js

/**
 * Carrega os depositos pendentes do banco de dados e atualiza a tabela.
 */
async function loadDepositosResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) {
        console.error("Elemento '.center-panel' não encontrado.");
        return;
    }

    centerPanel.innerHTML = '<h2>Depositos Pendentes</h2>';

    const table = document.createElement('table');
    table.classList.add('rotinas-table'); 
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Data da Criação</th>
                <th>Usuario ID</th>
                <th>Nome Completo</th>
                <th>Usuario</th>
                <th>Valor do Deposito</th>
                <th>Status</th>
                <th>Executar</th>
                <th>Cancelar</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    centerPanel.appendChild(table);

    try {
        const response = await fetch('/api/depositos/buscar-depositos-pendentes');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const depositos = await response.json();

        tbody.innerHTML = '';

        if (depositos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Nenhum deposito pendente encontrado.</td></tr>';
            return;
        }

        depositos.forEach(deposito => {
            const dateOptions = {
                timeZone: 'America/Sao_Paulo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            const formattedDate = new Intl.DateTimeFormat('pt-BR', dateOptions).format(new Date(deposito.data_criacao));
            
            // Semântica: formattedValue para exibição, rawValue para processamento backend
            const rawValue = deposito.valor_deposito; 
            const formattedValue = `R$ ${parseFloat(rawValue).toFixed(2).replace('.', ',')}`;
            const status = `<span style="color: #D9AA1C;">${deposito.status_deposito}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${deposito.id}</td>
                <td>${formattedDate}</td>
                <td>${deposito.usuario_id}</td>
                <td>${deposito.nome_completo}</td>
                <td>${deposito.email}</td>
                <td>${formattedValue}</td>
                <td>${status}</td>
                <td>
                    <button class="executar-button" onclick="executarDeposito(${deposito.id}, ${deposito.usuario_id}, '${rawValue}')">
                        Executar
                    </button>
                </td>
                <td>
                    <button class="cancelar-button" onclick="cancelarDeposito(${deposito.id})">
                        Cancelar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao carregar depositos pendentes:', error);
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;">Erro ao carregar os depositos.</td></tr>`;
    }
}

/**
 * Executa a liquidação do deposito no backend.
 * @param {number} depositoId - ID da solicitação de deposito.
 * @param {number} usuarioId - ID do usuário (parâmetro de rota).
 * @param {string} amount - Valor decimal puro para processamento BigInt.
 */
async function executarDeposito(depositoId, usuarioId, amount) {
    const confirmacao = confirm(`CONFIRMAR EXECUÇÃO\n\nDeposito ID: #${depositoId}\nUsuário: ${usuarioId}\nValor: R$ ${amount}\n\nO saldo será creditado da carteira do usuário. Deseja prosseguir?`);
    
    if (!confirmacao) return;

    try {
        // Rota definida conforme controller_deposito_executar.js
        const response = await fetch(`/api/depositos/executar/${usuarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                amount: amount,
                deposito_id: depositoId 
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Sucesso: Crédito realizado e transação processada.');
            await loadDepositosResults(); // Refresh da grid
        } else {
            // Captura erros de lógica (ex: 409 Conflict - Saldo Insuficiente)
            const errorMsg = data.error || (data.errors && data.errors[0].msg) || 'Erro no processamento.';
            alert(`Erro ao executar: ${errorMsg}`);
        }
    } catch (error) {
        console.error('Erro na requisição de execução:', error);
        alert('Erro de comunicação com o servidor. Verifique o log do console.');
    }
}

/**
 * Função para cancelar o deposito com seleção de motivo.
 * @param {number} depositoId 
 */
async function cancelarDeposito(depositoId) {
    const motivosValidos = {
        "1": "Valor da solicitação é diferente do valor do Pix.",
        "2": "Titular do Pix é diferente do titular da Purg."
    };

    const promptMensagem = `Cancelamento do Deposito #${depositoId}\n\n` +
        `Selecione o motivo digitando o número:\n` +
        `1 - Valor da solicitação é diferente do valor do Pix.\n` +
        `2 - Titular do Pix é diferente do titular da Purg.\n`;

    const inputRaw = prompt(promptMensagem);

    if (inputRaw === null) return;

    const motivoFinal = motivosValidos[inputRaw.trim()] || inputRaw.trim();

    if (!motivoFinal) {
        alert("É obrigatório informar um motivo para o cancelamento.");
        return;
    }

    try {
        const response = await fetch(`/api/v1/cancelar-deposito/${depositoId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo: motivoFinal })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Deposito cancelado com sucesso.');
            await loadDepositosResults(); 
        } else {
            alert(`Erro: ${data.message || 'Não foi possível cancelar o deposito.'}`);
        }
    } catch (error) {
        console.error('Erro na requisição de cancelamento:', error);
        alert('Erro de conexão com o servidor ao tentar cancelar.');
    }
}

// Exposição global para compatibilidade com os onclicks do HTML dinâmico
window.loadDepositosResults = loadDepositosResults;
window.executarDeposito = executarDeposito;
window.cancelarDeposito = cancelarDeposito;
