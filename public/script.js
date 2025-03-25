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
    const tokensButton = document.getElementById("tokensButton");
    const ecossistemaButton = document.getElementById("ecossistemaButton");
    const receitasButton = document.getElementById("receitasButton");

    console.log("Element references initialized");

    // Adiciona evento ao botão "Usuários"
    if (usuariosButton) {
        usuariosButton.addEventListener("click", () => {
            console.log("Botão 'Usuários' clicado");
            showUserCards(); // Mostra os cartões de criação e alteração de usuários
        });
    }

    // Adiciona evento ao botão "Resultados Financeiros"
    if (resultadosButton) {
        resultadosButton.addEventListener("click", () => {
            console.log("Botão 'Resultados Financeiros' clicado");
            loadFinancialResults(); // Chama a função no resultados_financeiros.js
        });
    }

    // Adiciona evento ao botão "Tokens"
    if (tokensButton) {
        tokensButton.addEventListener("click", () => {
            console.log("Botão 'Tokens' clicado");
            loadTokensResults();  // Chama a função no tokens.js
        });
    }

   // Adiciona evento ao botão "Ecossistema"
    if (ecossistemaButton) {
        ecossistemaButton.addEventListener("click", () => {
            console.log("Botão 'Ecossistema' clicado");
            loadEcossistemaResults();  // Chama a função no ecossistema.js
        });
    }

   // Adiciona evento ao botão "Receitas"
    if (receitasButton) {
        receitasButton.addEventListener("click", () => {
            console.log("Botão 'Receitas' clicado");
            loadReceitasResults();  // Chama a função no receitas.js
        });
    }

});

