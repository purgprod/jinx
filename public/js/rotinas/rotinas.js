// Limpa o container principal e atualiza o conteúdo com uma tabela
function loadRotinasResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (centerPanel) {
        // Limpa o conteúdo existente no centerPanel
        centerPanel.innerHTML = '';

        // Cria a tabela
        const table = document.createElement('table');
        table.classList.add('rotinas-table'); // Adiciona uma classe para estilização

        // Cria o cabeçalho da tabela
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Rotina</th>
                <th>Hora Padrão</th>
                <th>Última Execução</th>
                <th>Executar</th>
            </tr>
        `;
        table.appendChild(thead);

        // Cria o corpo da tabela
        const tbody = document.createElement('tbody');
        // Exemplo de como adicionar uma linha na tabela
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>Tokens - Histórico do Free Float</td>
            <td>16:00</td>
            <td id="ultima-execucao">2023-10-25 16:00</td>
            <td><button onclick="executarRotinaTokensHistoricoFreeFloat()">Executar</button></td>
        `;
        tbody.appendChild(tr);

        table.appendChild(tbody);

        // Adiciona a tabela ao centerPanel
        centerPanel.appendChild(table);
    }
}

// Função para formatar a data atual
function getDataFormatada() {
    const data = new Date();
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${data.getFullYear()} ${hora}:${minutos}`;
}

// Executar a rotina manualmente de Histórico Free Float dos Tokens
function executarRotinaTokensHistoricoFreeFloat() {
    // Obtém a data e hora atuais
    const dataAgora = getDataFormatada();

    fetch('/api/rotinas/tokens_historico_free_float', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        // Atualiza a coluna "Última Execução" com a data atual
        const ultimaExecucaoCell = document.getElementById('ultima-execucao');
        if (ultimaExecucaoCell) {
            ultimaExecucaoCell.textContent = dataAgora;
        }
    })
    .catch(error => {
        console.error('Erro ao executar rotina:', error);
    });
}

// Torna as funções acessíveis no escopo global
window.loadRotinasResults = loadRotinasResults;
window.executarRotinaTokensHistoricoFreeFloat = executarRotinaTokensHistoricoFreeFloat;

