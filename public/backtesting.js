document.addEventListener("DOMContentLoaded", () => {
    const backtestButton = document.getElementById("backtestButton");
    const runBacktestButton = document.getElementById("runBacktestButton");
    const padraoButton = document.getElementById("padraoButton");
    const personalizadoButton = document.getElementById("personalizadoButton");
    const configRightPanel = document.getElementById("config-right-panel");
    const marketButtons = document.querySelectorAll(".market-button");

    // Redirecionamento para a página de backtesting
    if (backtestButton) {
        backtestButton.addEventListener("click", () => {
            window.location.href = '/backtest';
        });
    }

    // Função para executar o backtest
    if (runBacktestButton) {
        runBacktestButton.addEventListener("click", () => {
            const flag = document.getElementById("flag-select").value;
            const marketTypeButton = document.querySelector(".market-button.active");
            const startDate = document.getElementById("startDateInput").value;
            const endDate = document.getElementById("endDateInput").value;

            if (!marketTypeButton) {
                console.error("Nenhum mercado selecionado.");
                return;
            }

            // Certifique-se de que os IDs dos botões correspondem aos valores no mapeamento
            const marketTypeMap = {
                "backtest-golsMandanteButton": "gols_mandante",
                "backtest-golsVisitanteButton": "gols_visitante",
                "backtest-escanteiosMandanteButton": "escanteios_mandante"
            };

            const marketType = marketTypeMap[marketTypeButton.id];

            console.log("Parâmetros capturados:", { flag, marketType, startDate, endDate });

            if (!marketType || !startDate || !endDate) {
                console.error("Um ou mais parâmetros estão faltando.");
                return;
            }

            const params = new URLSearchParams({
                flag,
                marketType,
                startDate,
                endDate,
            });

            fetch(`/backtest?${params.toString()}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro na resposta da requisição');
                    }
                    return response.json();
                })
                .then(data => {
                    const resultsContainer = document.getElementById("backtest-results");
                    if (!resultsContainer) {
                        console.error('Elemento backtest-results não encontrado.');
                        return;
                    }
                    resultsContainer.innerHTML = '';

                    if (data.length === 0) {
                        resultsContainer.innerHTML = '<p>Nenhum resultado encontrado.</p>';
                        return;
                    }

                    data.forEach(result => {
                        const resultHtml = `
                            <div class="result-card">
                                <h3>${result.mandante_nome}</h3>
                                <p>Total de Jogos: ${result.total_jogos}</p>
                                <p>Menos de 3.5: ${result.menos_3_5}</p>
                                <p>Mais de 4.5: ${result.mais_4_5}</p>
                            </div>
                        `;
                        resultsContainer.innerHTML += resultHtml;
                    });
                })
                .catch(error => {
                    console.error('Erro ao executar o backtest:', error);
                    const resultsContainer = document.getElementById("backtest-results");
                    if (resultsContainer) {
                        resultsContainer.innerHTML = '<p>Erro ao executar o backtest. Verifique o console para mais detalhes.</p>';
                    }
                });
        });
    }

    // Configuração de comportamento dos botões Padrão e Personalizado
    if (padraoButton && personalizadoButton && configRightPanel) {
        padraoButton.addEventListener("click", () => {
            configRightPanel.style.display = 'none';
            padraoButton.classList.add("active");
            personalizadoButton.classList.remove("active");

            // Ativa todos os botões de mercado
            marketButtons.forEach(button => {
                button.classList.add("active");
            });
        });

        personalizadoButton.addEventListener("click", () => {
            configRightPanel.style.display = 'block';
            personalizadoButton.classList.add("active");
            padraoButton.classList.remove("active");

            // Desativa todos os botões de mercado para permitir a seleção manual
            marketButtons.forEach(button => {
                button.classList.remove("active");
            });
        });

        // Permite a seleção manual dos botões de mercado no modo Personalizado
        marketButtons.forEach(button => {
            button.addEventListener("click", () => {
                button.classList.toggle("active");
            });
        });
    } else {
        console.error("Elementos de configuração padrão/personalizado não encontrados.");
    }
});
