// public/js/ranking/ranking.js

/**
 * Carrega e exibe o ranking de usuários por pontos.
 * Lê a tabela ranking (atualizada por trigger no banco sempre que
 * carteiras.pontos ou carteiras.liga é modificado).
 */
async function loadRankingResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) {
        console.error("Elemento '.center-panel' não encontrado.");
        return;
    }

    centerPanel.innerHTML = '<h2 class="page-title">Ranking de Pontos</h2>';

    const table = document.createElement('table');
    table.classList.add('rotinas-table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Liga</th>
                <th>Pontos</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    centerPanel.appendChild(table);

    try {
        const response = await fetch('/api/ranking');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        const ranking = await response.json();

        tbody.innerHTML = '';

        if (!ranking || ranking.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum dado de ranking disponível.</td></tr>';
            return;
        }

        ranking.forEach(entry => {
            const tr = document.createElement('tr');

            // Medalhas para o pódio
            let posicaoLabel;
            if (entry.posicao === 1)      posicaoLabel = '🥇 1º';
            else if (entry.posicao === 2) posicaoLabel = '🥈 2º';
            else if (entry.posicao === 3) posicaoLabel = '🥉 3º';
            else                          posicaoLabel = `${entry.posicao}º`;

            tr.innerHTML = `
                <td style="font-weight:600; white-space:nowrap;">${posicaoLabel}</td>
                <td>${entry.nome}</td>
                <td>${entry.liga || '—'}</td>
                <td style="text-align:right;">${Number(entry.pontos).toLocaleString('pt-BR')}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Erro ao carregar ranking:', err);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Erro ao carregar ranking: ${err.message}</td></tr>`;
    }
}
