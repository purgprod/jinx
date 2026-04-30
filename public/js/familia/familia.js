// public/js/familia/familia.js

async function loadFamiliaResults() {
    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) return;

    centerPanel.innerHTML = `
        <h2 class="page-title">Modo Família</h2>
        <div id="familia-tabs" style="display:flex;gap:12px;margin-bottom:20px;">
            <button class="button-novo" id="tabVinculosBtn" onclick="mostrarAbaFamilia('vinculos')">Vínculos Ativos</button>
            <button class="config-button" id="tabConvitesBtn" onclick="mostrarAbaFamilia('convites')">Convites</button>
        </div>
        <div id="familia-content"></div>
    `;

    mostrarAbaFamilia('vinculos');
}

async function mostrarAbaFamilia(aba) {
    document.getElementById('tabVinculosBtn').className = aba === 'vinculos' ? 'button-novo' : 'config-button';
    document.getElementById('tabConvitesBtn').className = aba === 'convites' ? 'button-novo' : 'config-button';

    if (aba === 'vinculos') {
        await renderVinculos();
    } else {
        await renderConvites();
    }
}

async function renderVinculos() {
    const content = document.getElementById('familia-content');
    content.innerHTML = '<p>Carregando vínculos...</p>';

    try {
        const res  = await fetch('/api/admin/familia/vinculos');
        const data = await res.json();

        if (!data.success) {
            content.innerHTML = `<p style="color:red;">Erro ao carregar vínculos: ${data.message}</p>`;
            return;
        }

        if (data.vinculos.length === 0) {
            content.innerHTML = '<p>Nenhum vínculo familiar ativo.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'rotinas-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Responsável</th>
                    <th>E-mail Responsável</th>
                    <th>Dependente</th>
                    <th>E-mail Dependente</th>
                    <th>Status Dependente</th>
                    <th>Criado em</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        const fmt = (d) => new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(d));

        data.vinculos.forEach(v => {
            const statusBadge = v.tutelado_ativo
                ? '<span style="color:#4caf50;">Ativo</span>'
                : '<span style="color:#e53935;">Inativo</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.id}</td>
                <td>${v.guardiao_apelido || '—'} (${v.guardiao_id})</td>
                <td>${v.guardiao_email}</td>
                <td>${v.tutelado_apelido || '—'} (${v.tutelado_id})</td>
                <td>${v.tutelado_email}</td>
                <td>${statusBadge}</td>
                <td>${fmt(v.criado_em)}</td>
                <td>
                    <button class="cancelar-button"
                        onclick="revogarVinculoAdmin(${v.guardiao_id}, ${v.tutelado_id})">
                        Revogar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        content.innerHTML = '';
        content.appendChild(table);

    } catch (err) {
        content.innerHTML = `<p style="color:red;">Erro de comunicação com o servidor.</p>`;
        console.error('[familia] Erro ao carregar vínculos:', err);
    }
}

async function renderConvites() {
    const content = document.getElementById('familia-content');
    content.innerHTML = '<p>Carregando convites...</p>';

    try {
        const res  = await fetch('/api/admin/familia/convites');
        const data = await res.json();

        if (!data.success) {
            content.innerHTML = `<p style="color:red;">Erro ao carregar convites: ${data.message}</p>`;
            return;
        }

        if (data.convites.length === 0) {
            content.innerHTML = '<p>Nenhum convite registrado.</p>';
            return;
        }

        const statusCor = { pendente: '#D9AA1C', aceito: '#4caf50', expirado: '#9e9e9e', cancelado: '#e53935' };

        const table = document.createElement('table');
        table.className = 'rotinas-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Responsável</th>
                    <th>E-mail Responsável</th>
                    <th>E-mail Convidado</th>
                    <th>Status</th>
                    <th>Expira em</th>
                    <th>Criado em</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        const fmt = (d) => new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(d));

        data.convites.forEach(c => {
            const cor    = statusCor[c.status] || '#fff';
            const acaoBtn = c.status === 'pendente'
                ? `<button class="cancelar-button" onclick="cancelarConviteAdmin(${c.id})">Cancelar</button>`
                : '—';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id}</td>
                <td>${c.guardiao_apelido || '—'} (${c.guardiao_id})</td>
                <td>${c.guardiao_email}</td>
                <td>${c.email_convidado}</td>
                <td><span style="color:${cor};">${c.status}</span></td>
                <td>${fmt(c.expira_em)}</td>
                <td>${fmt(c.criado_em)}</td>
                <td>${acaoBtn}</td>
            `;
            tbody.appendChild(tr);
        });

        content.innerHTML = '';
        content.appendChild(table);

    } catch (err) {
        content.innerHTML = `<p style="color:red;">Erro de comunicação com o servidor.</p>`;
        console.error('[familia] Erro ao carregar convites:', err);
    }
}

async function revogarVinculoAdmin(guardiaoId, tuteladoId) {
    const ok = confirm(`Revogar vínculo?\n\nResponsável ID: ${guardiaoId}\nDependente ID: ${tuteladoId}\n\nEsta ação não pode ser desfeita.`);
    if (!ok) return;

    try {
        const res  = await fetch(`/api/admin/familia/vinculos/${guardiaoId}/${tuteladoId}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            alert('Vínculo revogado com sucesso.');
            await renderVinculos();
        } else {
            alert(`Erro: ${data.message}`);
        }
    } catch (err) {
        alert('Erro de comunicação com o servidor.');
        console.error('[familia] Erro ao revogar vínculo:', err);
    }
}

async function cancelarConviteAdmin(id) {
    const ok = confirm(`Cancelar convite ID ${id}?`);
    if (!ok) return;

    try {
        const res  = await fetch(`/api/admin/familia/convites/${id}/cancelar`, { method: 'PUT' });
        const data = await res.json();

        if (data.success) {
            alert('Convite cancelado com sucesso.');
            await renderConvites();
        } else {
            alert(`Erro: ${data.message}`);
        }
    } catch (err) {
        alert('Erro de comunicação com o servidor.');
        console.error('[familia] Erro ao cancelar convite:', err);
    }
}

window.loadFamiliaResults   = loadFamiliaResults;
window.mostrarAbaFamilia    = mostrarAbaFamilia;
window.revogarVinculoAdmin  = revogarVinculoAdmin;
window.cancelarConviteAdmin = cancelarConviteAdmin;
