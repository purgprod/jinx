document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");

    // Referências aos elementos do DOM
    const padraoButton = document.getElementById("padraoButton");
    const personalizadoButton = document.getElementById("personalizadoButton");
    const atualizarButton = document.getElementById("atualizarButton");
    const flagSelect = document.getElementById("flag-select");
    const mainContainer = document.getElementById("main-container");
    const usuariosButton = document.getElementById("usuariosButton");
    const resultadosButton = document.getElementById("resultadosButton");
    const pinsButton = document.getElementById("pinsButton");
    const ecossistemaButton = document.getElementById("ecossistemaButton");
    const receitasButton = document.getElementById("receitasButton");
    const rotinasButton = document.getElementById("rotinasButton");
    const assinaturasButton = document.getElementById("assinaturasButton");
    const emblemasButton = document.getElementById("emblemasButton");
    const saquesButton = document.getElementById("saquesButton");
    const depositosButton = document.getElementById("depositosButton");
    const rankingButton   = document.getElementById("rankingButton");
    const luluButton      = document.getElementById("luluButton");

    console.log("Element references initialized");

    // -------------------------------------------------------
    // Roteamento client-side via History API
    // -------------------------------------------------------

    // Atualiza a URL sem recarregar a página (no-op se já estiver no mesmo path)
    function pushRoute(path) {
        if (window.location.pathname !== path) {
            window.history.pushState({ path }, '', path);
        }
    }

    // Mapa de path → botão responsável por carregar o conteúdo da aba
    const tabRouteMap = {
        '/usuarios':               usuariosButton,
        '/resultados-financeiros': resultadosButton,
        '/pins':                   pinsButton,
        '/ecossistema':            ecossistemaButton,
        '/receitas':               receitasButton,
        '/assinaturas':            assinaturasButton,
        '/emblemas':               emblemasButton,
        '/saques':                 saquesButton,
        '/depositos':              depositosButton,
        '/rotinas':                rotinasButton,
        '/ranking':                rankingButton,
        '/lulu':                   luluButton,
    };

    // Carrega o conteúdo da aba correspondente ao path (simula clique no botão)
    function loadTabFromPath(pathname) {
        const btn = tabRouteMap[pathname];
        if (btn) btn.click();
    }

    // Navegar pelo histórico do browser (botões Voltar / Avançar)
    window.addEventListener('popstate', (event) => {
        loadTabFromPath(event.state?.path || '/home');
    });

    // Após autenticação confirmada: define o estado inicial do histórico e
    // carrega a aba correspondente à URL atual (ex: acesso direto a /usuarios)
    document.addEventListener('jinx:auth-ready', () => {
        const currentPath = window.location.pathname;
        window.history.replaceState({ path: currentPath }, '', currentPath);
        loadTabFromPath(currentPath);
    });

    // -------------------------------------------------------
    // Event listeners dos botões (com atualização de URL)
    // -------------------------------------------------------

    if (usuariosButton) {
        usuariosButton.addEventListener("click", () => {
            console.log("Botão 'Usuários' clicado");
            pushRoute('/usuarios');
            showUserCards();
        });
    }

    if (resultadosButton) {
        resultadosButton.addEventListener("click", () => {
            console.log("Botão 'Resultados Financeiros' clicado");
            pushRoute('/resultados-financeiros');
            loadFinancialResults();
        });
    }

    if (pinsButton) {
        pinsButton.addEventListener("click", () => {
            console.log("Botão 'Pins' clicado");
            pushRoute('/pins');
            loadPinsResults();
        });
    }

    if (ecossistemaButton) {
        ecossistemaButton.addEventListener("click", () => {
            console.log("Botão 'Ecossistema' clicado");
            pushRoute('/ecossistema');
            loadEcossistemaResults();
        });
    }

    if (receitasButton) {
        receitasButton.addEventListener("click", () => {
            console.log("Botão 'Receitas' clicado");
            pushRoute('/receitas');
            loadReceitasResults();
        });
    }

    if (rotinasButton) {
        rotinasButton.addEventListener("click", () => {
            console.log("Botão 'Rotinas' clicado");
            pushRoute('/rotinas');
            loadRotinasResults();
        });
    }

    if (assinaturasButton) {
        assinaturasButton.addEventListener("click", () => {
            console.log("Botão 'Assinaturas' clicado");
            pushRoute('/assinaturas');
            loadAssinaturasResults();
        });
    }

    if (emblemasButton) {
        emblemasButton.addEventListener("click", () => {
            console.log("Botão 'Emblemas' clicado");
            pushRoute('/emblemas');
            loadEmblemasResults();
        });
    }

    if (saquesButton) {
        saquesButton.addEventListener("click", () => {
            console.log("Botão 'Saques' clicado");
            pushRoute('/saques');
            loadSaquesResults();
        });
    }

    if (depositosButton) {
        depositosButton.addEventListener("click", () => {
            console.log("Botão 'Depositos' clicado");
            pushRoute('/depositos');
            loadDepositosResults();
        });
    }

    if (rankingButton) {
        rankingButton.addEventListener("click", () => {
            console.log("Botão 'Ranking' clicado");
            pushRoute('/ranking');
            loadRankingResults();
        });
    }

    if (luluButton) {
        luluButton.addEventListener("click", () => {
            console.log("Botão 'Lulu' clicado");
            pushRoute('/lulu');
            loadLuluResults();
        });
    }

});
