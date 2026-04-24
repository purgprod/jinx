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
}

window.loadAdminPanel = loadAdminPanel;
