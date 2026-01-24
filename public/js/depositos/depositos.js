// Carrega os depositos pendentes do banco de dados e atualiza a tabela
async function loadDepositosResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) {
        console.error("Elemento '.center-panel' não encontrado.");
        return;
    }

    // Limpa o conteúdo e define o título
    centerPanel.innerHTML = '<h2>Depositos Pendentes</h2>';

    // Cria a estrutura da tabela
    const table = document.createElement('table');
    table.classList.add('rotinas-table'); // Considere renomear para 'depositos-table' no CSS
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
        <tbody>
            <!-- Os dados serão inseridos aqui -->
        </tbody>
    `;
    const tbody = table.querySelector('tbody');
    centerPanel.appendChild(table);

    try {
        // Buscar depositos pendentes da API
        const response = await fetch('/api/depositos/buscar-depositos-pendentes');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const depositos = await response.json();

        // Limpa o corpo da tabela antes de adicionar novas linhas
        tbody.innerHTML = '';

        if (depositos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum deposito pendente encontrado.</td></tr>';
            return;
        }

        // Adiciona cada deposito na tabela
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
            const formattedValue = `R$ ${parseFloat(deposito.valor_deposito).toFixed(2).replace('.', ',')}`;
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
                    <button onclick="executarDeposito(${deposito.id})">
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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar os depositos.</td></tr>`;
    }
}

// Função para executar o deposito (placeholder)
// Você deve implementar a lógica de chamada da API aqui
async function executarDeposito(depositoId) {
    console.log(`Tentando executar o deposito com ID: ${depositoId}`);
    try {
        // Exemplo de como chamar a API para executar o deposito
        /*
        const response = await fetch(`/api/depositos/executar/${depositoId}`, { method: 'POST' });
        if (response.ok) {
            alert('Deposito executado com sucesso!');
            loadDepositosResults(); // Recarrega a lista de depositos
        } else {
            const errorData = await response.json();
            alert(`Erro ao executar deposito: ${errorData.message}`);
        }
        */
       alert(`Funcionalidade "Executar Deposito" para o ID ${depositoId} a ser implementada.`);

    } catch (error) {
        console.error('Erro ao executar o deposito:', error);
        alert('Ocorreu um erro na comunicação com o servidor.');
    }
}

// Torna as funções acessíveis no escopo global para serem chamadas por 'script.js' e pelos 'onclick'
window.loadDepositosResults = loadDepositosResults;
window.executarDeposito = executarDeposito;
window.cancelarDeposito = cancelarDeposito;

