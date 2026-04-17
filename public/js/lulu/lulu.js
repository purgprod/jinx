// public/js/lulu/lulu.js

async function loadLuluResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) return;

    centerPanel.innerHTML = '<h2 class="page-title">Lulu — Amortização de Taxas de Cartão</h2><p>Carregando...</p>';

    try {
        const [resumo, historico, top10, config] = await Promise.all([
            fetch('/api/lulu/resumo').then(r => r.json()),
            fetch('/api/lulu/historico?dias=30').then(r => r.json()),
            fetch('/api/lulu/top10').then(r => r.json()),
            fetch('/api/lulu/config').then(r => r.json()),
        ]);

        const fmt = v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        centerPanel.innerHTML = `
            <h2 class="page-title">Lulu — Amortização de Taxas de Cartão</h2>

            <!-- Cards de resumo -->
            <div class="cards-basico">
                <div class="card">
                    <div class="card-content">
                        <p><strong>Total Pendente</strong></p>
                        <p>R$ <span id="lulu-total-pendente">${fmt(resumo.total_pendente)}</span></p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p><strong>Usuários com Saldo Devedor</strong></p>
                        <p><span id="lulu-total-usuarios">${resumo.total_usuarios}</span></p>
                    </div>
                </div>
            </div>

            <!-- Gráficos -->
            <h2>Evolução do Total Pendente (últimos 30 dias)</h2>
            <canvas id="luluChartPendente"></canvas>

            <h2>Evolução de Usuários com Débito (últimos 30 dias)</h2>
            <canvas id="luluChartUsuarios"></canvas>

            <!-- Top 10 -->
            <h2>Top 10 — Maiores Saldos Devedores</h2>
            <table class="data-table" id="lulu-top10-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Usuário</th>
                        <th>Pendente</th>
                        <th>Desde</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>

            <!-- Configurações -->
            <h2>Configurações</h2>
            <form id="lulu-config-form">
                <table class="data-table">
                    <tr>
                        <td><label for="lulu-percentual">Percentual de dedução diária (%):</label></td>
                        <td><input type="number" id="lulu-percentual" step="0.01" min="0.01" max="100"
                                   value="${Number(config.percentual_deducao).toFixed(2)}"></td>
                    </tr>
                    <tr>
                        <td><label for="lulu-taxa-cartao">Taxa cobrada pelo Efí (%):</label></td>
                        <td><input type="number" id="lulu-taxa-cartao" step="0.01" min="0.01" max="100"
                                   value="${Number(config.taxa_cartao_percentual).toFixed(2)}"></td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <div class="button-container">
                                <button type="submit" class="button-azul">Salvar</button>
                            </div>
                        </td>
                    </tr>
                </table>
                <p id="lulu-config-msg" style="color:green; display:none;"></p>
            </form>
        `;

        // Gráfico: Total Pendente
        const labels = historico.map(h => h.data);
        const pendentes = historico.map(h => parseFloat(h.total_pendente));
        const usuarios  = historico.map(h => h.total_usuarios);

        new Chart(document.getElementById('luluChartPendente').getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Total Pendente (R$)',
                    data: pendentes,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) } }
                }
            }
        });

        // Gráfico: Usuários com débito
        new Chart(document.getElementById('luluChartUsuarios').getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Usuários com Débito',
                    data: usuarios,
                    borderColor: '#e67e22',
                    backgroundColor: 'rgba(230, 126, 34, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });

        // Tabela Top 10
        const tbody = document.querySelector('#lulu-top10-table tbody');
        if (!top10.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum débito pendente.</td></tr>';
        } else {
            top10.forEach((row, i) => {
                const desde = new Date(row.desde).toLocaleDateString('pt-BR');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}º</td>
                    <td>${row.apelido || row.nome_completo || row.usuario_id}</td>
                    <td>R$ ${fmt(row.valor_pendente)}</td>
                    <td>${desde}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Formulário de config
        document.getElementById('lulu-config-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const percentual   = document.getElementById('lulu-percentual').value;
            const taxaCartao   = document.getElementById('lulu-taxa-cartao').value;
            const msg          = document.getElementById('lulu-config-msg');

            try {
                const resp = await fetch('/api/lulu/config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ percentual_deducao: percentual, taxa_cartao_percentual: taxaCartao })
                });
                const data = await resp.json();
                msg.textContent = resp.ok ? data.message : (data.error || 'Erro ao salvar.');
                msg.style.color = resp.ok ? 'green' : 'red';
                msg.style.display = 'block';
                setTimeout(() => { msg.style.display = 'none'; }, 3000);
            } catch (err) {
                console.error('Erro ao salvar config Lulu:', err);
            }
        });

    } catch (err) {
        console.error('Erro ao carregar painel Lulu:', err);
        centerPanel.innerHTML += `<p style="color:red;">Erro ao carregar dados: ${err.message}</p>`;
    }
}
