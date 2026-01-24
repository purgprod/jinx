// public/js/saques/saques.js

/**
 * Carrega os saques pendentes do banco de dados e atualiza a tabela.
 */
async function loadSaquesResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) {
        console.error("Elemento '.center-panel' não encontrado.");
        return;
    }

    centerPanel.innerHTML = '<h2>Saques Pendentes</h2>';

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
                <th>Valor do Saque</th>
                <th>Chave Pix</th>
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
        const response = await fetch('/api/saques/buscar-saques-pendentes');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const saques = await response.json();

        tbody.innerHTML = '';

        if (saques.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Nenhum saque pendente encontrado.</td></tr>';
            return;
        }

        saques.forEach(saque => {
            const dateOptions = {
                timeZone: 'America/Sao_Paulo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            const formattedDate = new Intl.DateTimeFormat('pt-BR', dateOptions).format(new Date(saque.data_criacao));
            
            // Semântica: formattedValue para exibição, rawValue para processamento backend
            const rawValue = saque.valor_saque; 
            const formattedValue = `R$ ${parseFloat(rawValue).toFixed(2).replace('.', ',')}`;
            const status = `<span style="color: #D9AA1C;">${saque.status_saque}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${saque.id}</td>
                <td>${formattedDate}</td>
                <td>${saque.usuario_id}</td>
                <td>${saque.nome_completo}</td>
                <td>${saque.email}</td>
                <td>${formattedValue}</td>
                <td>${saque.chave_pix}</td>
                <td>${status}</td>
                <td>
                    <button class="executar-button" onclick="executarSaque(${saque.id}, ${saque.usuario_id}, '${rawValue}')">
                        Executar
                    </button>
                </td>
                <td>
                    <button class="cancelar-button" onclick="cancelarSaque(${saque.id})">
                        Cancelar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao carregar saques pendentes:', error);
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;">Erro ao carregar os saques.</td></tr>`;
    }
}

/**
 * Executa a liquidação do saque no backend.
 * @param {number} saqueId - ID da solicitação de saque.
 * @param {number} usuarioId - ID do usuário (parâmetro de rota).
 * @param {string} amount - Valor decimal puro para processamento BigInt.
 */
async function executarSaque(saqueId, usuarioId, amount) {
    const confirmacao = confirm(`CONFIRMAR EXECUÇÃO\n\nSaque ID: #${saqueId}\nUsuário: ${usuarioId}\nValor: R$ ${amount}\n\nO saldo será debitado da carteira do usuário. Deseja prosseguir?`);
    
    if (!confirmacao) return;

    try {
        // Rota definida conforme controller_saque_executar.js
        const response = await fetch(`/api/saques/executar/${usuarioId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                amount: amount,
                saque_id: saqueId 
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Sucesso: Débito realizado e transação processada.');
            await loadSaquesResults(); // Refresh da grid
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
 * Função para cancelar o saque com seleção de motivo.
 * @param {number} saqueId 
 */
async function cancelarSaque(saqueId) {
    const motivosValidos = {
        "1": "Chave Pix não existe.",
        "2": "Titular do Pix é diferente do titular da Purg."
    };

    const promptMensagem = `Cancelamento do Saque #${saqueId}\n\n` +
        `Selecione o motivo digitando o número:\n` +
        `1 - Chave Pix não existe.\n` +
        `2 - Titular do Pix é diferente do titular da Purg.\n`;

    const inputRaw = prompt(promptMensagem);

    if (inputRaw === null) return;

    const motivoFinal = motivosValidos[inputRaw.trim()] || inputRaw.trim();

    if (!motivoFinal) {
        alert("É obrigatório informar um motivo para o cancelamento.");
        return;
    }

    try {
        const response = await fetch(`/endpoints/cancelar-saque/${saqueId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo: motivoFinal })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Saque cancelado com sucesso.');
            await loadSaquesResults(); 
        } else {
            alert(`Erro: ${data.message || 'Não foi possível cancelar o saque.'}`);
        }
    } catch (error) {
        console.error('Erro na requisição de cancelamento:', error);
        alert('Erro de conexão com o servidor ao tentar cancelar.');
    }
}

// Exposição global para compatibilidade com os onclicks do HTML dinâmico
window.loadSaquesResults = loadSaquesResults;
window.executarSaque = executarSaque;
window.cancelarSaque = cancelarSaque;
