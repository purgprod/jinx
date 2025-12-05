// Carrega os saques pendentes do banco de dados e atualiza a tabela
async function loadSaquesResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) {
        console.error("Elemento '.center-panel' não encontrado.");
        return;
    }

    // Limpa o conteúdo e define o título
    centerPanel.innerHTML = '<h2>Saques Pendentes</h2>';

    // Cria a estrutura da tabela
    const table = document.createElement('table');
    table.classList.add('rotinas-table'); // Considere renomear para 'saques-table' no CSS
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
        <tbody>
            <!-- Os dados serão inseridos aqui -->
        </tbody>
    `;
    const tbody = table.querySelector('tbody');
    centerPanel.appendChild(table);

    try {
        // Buscar saques pendentes da API
        const response = await fetch('/api/saques/buscar-saques-pendentes');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const saques = await response.json();

        // Limpa o corpo da tabela antes de adicionar novas linhas
        tbody.innerHTML = '';

        if (saques.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum saque pendente encontrado.</td></tr>';
            return;
        }

        // Adiciona cada saque na tabela
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
            const formattedValue = `R$ ${parseFloat(saque.valor_saque).toFixed(2).replace('.', ',')}`;
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
                    <button onclick="executarSaque(${saque.id})">
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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar os saques.</td></tr>`;
    }
}

// Função para executar o saque (placeholder)
// Você deve implementar a lógica de chamada da API aqui
async function executarSaque(saqueId) {
    console.log(`Tentando executar o saque com ID: ${saqueId}`);
    try {
        // Exemplo de como chamar a API para executar o saque
        /*
        const response = await fetch(`/api/saques/executar/${saqueId}`, { method: 'POST' });
        if (response.ok) {
            alert('Saque executado com sucesso!');
            loadSaquesResults(); // Recarrega a lista de saques
        } else {
            const errorData = await response.json();
            alert(`Erro ao executar saque: ${errorData.message}`);
        }
        */
       alert(`Funcionalidade "Executar Saque" para o ID ${saqueId} a ser implementada.`);

    } catch (error) {
        console.error('Erro ao executar o saque:', error);
        alert('Ocorreu um erro na comunicação com o servidor.');
    }
}

// Torna as funções acessíveis no escopo global para serem chamadas por 'script.js' e pelos 'onclick'
window.loadSaquesResults = loadSaquesResults;
window.executarSaque = executarSaque;
window.cancelarSaque = cancelarSaque;

