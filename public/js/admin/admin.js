function loadAdminPanel() {
    const centerPanel = document.querySelector('.center-panel');
    if (!centerPanel) return;

    centerPanel.innerHTML = `
        <h2>Admin</h2>

        <div class="admin-debug-card">
            <h3>Modo Debug</h3>
            <p>Ativa logs detalhados de queries e controllers em <code>debug-*.log</code>.<br>
               Desative após o diagnóstico para não acumular volume de log.</p>
            <div class="debug-toggle-row">
                <span class="debug-toggle-label">Debug</span>
                <label class="switch">
                    <input type="checkbox" id="debugToggle">
                    <span class="slider"></span>
                </label>
                <span class="debug-status-badge" id="debugStatusBadge">INATIVO</span>
            </div>
        </div>

        <div class="admin-debug-card">
            <h3>Taxa CDI</h3>
            <p>Taxa CDI praticada no mercado hoje, usada como referência nos cálculos da plataforma.</p>
            <div class="debug-toggle-row">
                <input type="number" id="cdiInput" min="0" max="100" step="0.01"
                       placeholder="ex: 10.65" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #444;background:#1a1a1a;color:#fff;font-size:14px;">
                <span style="color:#aaa;font-size:13px;">% a.a.</span>
            </div>
            <div class="debug-toggle-row" style="margin-top:10px;">
                <span style="color:#aaa;font-size:13px;margin-right:8px;">Próxima reunião COPOM</span>
                <input type="date" id="copomInput"
                       style="padding:6px 10px;border-radius:6px;border:1px solid #444;background:#1a1a1a;color:#fff;font-size:14px;">
            </div>
            <div style="margin-top:12px;">
                <button id="cdiSalvarBtn" class="config-button" style="padding:6px 18px;">Salvar</button>
                <span id="cdiStatus" style="margin-left:12px;font-size:13px;color:#aaa;"></span>
            </div>
            <p id="cdiAtualizadoEm" style="font-size:12px;color:#666;margin-top:8px;"></p>
        </div>
    `;

    const toggle = document.getElementById('debugToggle');
    const badge  = document.getElementById('debugStatusBadge');

    function aplicarEstado(ativo) {
        toggle.checked = ativo;
        if (ativo) {
            badge.textContent = 'ATIVO';
            badge.classList.add('ativo');
        } else {
            badge.textContent = 'INATIVO';
            badge.classList.remove('ativo');
        }
    }

    // Carrega o estado atual
    fetch('/api/admin/debug/status')
        .then(r => r.json())
        .then(data => aplicarEstado(data.debug))
        .catch(() => console.error('Erro ao buscar status do modo debug'));

    // Toggling
    toggle.addEventListener('change', () => {
        fetch('/api/admin/debug/toggle', { method: 'POST' })
            .then(r => r.json())
            .then(data => aplicarEstado(data.debug))
            .catch(() => {
                console.error('Erro ao alternar modo debug');
                toggle.checked = !toggle.checked;
            });
    });

    // ── Taxa CDI ──────────────────────────────────────────────────────────────
    const cdiInput        = document.getElementById('cdiInput');
    const copomInput      = document.getElementById('copomInput');
    const cdiSalvarBtn    = document.getElementById('cdiSalvarBtn');
    const cdiStatus       = document.getElementById('cdiStatus');
    const cdiAtualizadoEm = document.getElementById('cdiAtualizadoEm');

    fetch('/api/admin/taxa-cdi')
        .then(r => r.json())
        .then(data => {
            cdiInput.value = data.valor;
            if (data.proxima_reuniao_copom) {
                copomInput.value = data.proxima_reuniao_copom.slice(0, 10);
            }
            const dt = new Date(data.atualizado_em).toLocaleString('pt-BR');
            cdiAtualizadoEm.textContent = `Última atualização: ${dt}`;
        })
        .catch(() => cdiStatus.textContent = 'Erro ao carregar taxa CDI.');

    cdiSalvarBtn.addEventListener('click', () => {
        const valor = parseFloat(cdiInput.value);
        if (isNaN(valor) || valor < 0 || valor > 100) {
            cdiStatus.textContent = 'Informe um valor entre 0 e 100.';
            cdiStatus.style.color = '#e74c3c';
            return;
        }
        cdiSalvarBtn.disabled = true;
        cdiStatus.textContent = 'Salvando...';
        cdiStatus.style.color = '#aaa';

        fetch('/api/admin/taxa-cdi', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor, proxima_reuniao_copom: copomInput.value || null }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    cdiStatus.textContent = 'Salvo!';
                    cdiStatus.style.color = '#2ecc71';
                    cdiAtualizadoEm.textContent = `Última atualização: ${new Date().toLocaleString('pt-BR')}`;
                } else {
                    cdiStatus.textContent = data.error || 'Erro ao salvar.';
                    cdiStatus.style.color = '#e74c3c';
                }
            })
            .catch(() => {
                cdiStatus.textContent = 'Erro de conexão.';
                cdiStatus.style.color = '#e74c3c';
            })
            .finally(() => { cdiSalvarBtn.disabled = false; });
    });
}

window.loadAdminPanel = loadAdminPanel;
