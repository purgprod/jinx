// public/scripts.js

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

    console.log("Element references initialized");

    // Adiciona evento ao botão "Usuários"
    if (usuariosButton) {
        usuariosButton.addEventListener("click", () => {
            console.log("Botão 'Usuários' clicado");
            loadUsers(); // Certifique-se de que a função loadUsers está definida no usuarios.js
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

});

