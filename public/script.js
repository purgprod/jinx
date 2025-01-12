document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");

    const padraoButton = document.getElementById("padraoButton");
    const personalizadoButton = document.getElementById("personalizadoButton");
    const atualizarButton = document.getElementById("atualizarButton");
    const golsMandanteButton = document.getElementById("golsMandanteButton");
    const golsVisitanteButton = document.getElementById("golsVisitanteButton");
    const escanteiosMandanteButton = document.getElementById("escanteiosMandanteButton");
    const backtestButton = document.getElementById("backtestButton");
    const runBacktestButton = document.getElementById("runBacktestButton");
    const cardsContainer = document.getElementById("cardsContainer");
    const configRightPanel = document.getElementById("config-right-panel");
    const backtestPanel = document.getElementById("backtest-panel");
    const flagSelect = document.getElementById("flag-select");
    const gamesTableBody = document.getElementById('gamesTableBody');
    const logoutButton = document.getElementById("logoutButton");
    const loginForm = document.getElementById("loginForm");
    const mainContainer = document.getElementById("main-container");

    console.log("Element references initialized");

    // Função para redirecionar para a tela de login
    const redirecionarParaLogin = () => {
        console.log("Redirecionando para login");
        window.location.href = '/login';
    };

    // Função para atualizar a exibição do painel de configurações e estilo dos botões
    const atualizarPainelConfig = (modo) => {
        console.log(`Atualizando painel de configuração para o modo: ${modo}`);
        if (configRightPanel && flagSelect && padraoButton && personalizadoButton) {
            if (modo === "padrao") {
                configRightPanel.style.display = 'none';
                flagSelect.value = "Moderado";
                padraoButton.classList.add("active");
                personalizadoButton.classList.remove("active");
                golsMandanteButton.classList.add("active");
                golsVisitanteButton.classList.add("active");
                escanteiosMandanteButton.classList.add("active");
                if (backtestPanel) backtestPanel.style.display = 'none'; // Esconde o painel de backtest
            } else if (modo === "personalizado") {
                configRightPanel.style.display = 'block';
                personalizadoButton.classList.add("active");
                padraoButton.classList.remove("active");
                golsMandanteButton.classList.remove("active");
                golsVisitanteButton.classList.remove("active");
                escanteiosMandanteButton.classList.remove("active");
                if (backtestPanel) backtestPanel.style.display = 'block'; // Mostra o painel de backtest
            }
        }
    };

    // Verifica se o usuário já está autenticado
    fetch('/auth/check-session')
        .then(response => {
            console.log("Verificando sessão...");
            if (response.status === 401) {
                redirecionarParaLogin();
                throw new Error('Usuário não autenticado');
            } else {
                return response.json();
            }
        })
        .then(data => {
            if (data && data.authenticated) {
                console.log("Usuário autenticado");
                mainContainer.style.display = 'flex';
                mainContainer.classList.add("fade-in");
                atualizarPainelConfig("padrao");
                atualizarApostas();
                createGamesTable();
            }
        })
        .catch(error => {
            console.error('Erro ao verificar sessão:', error);
        });

    // Função para lidar com o login
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            console.log("Tentando login com email:", email);

            fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Login bem-sucedido");
                    loginForm.classList.add("fade-out");
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    console.error('Login falhou: ' + data.message);
                    alert('Login falhou: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro no servidor:', error);
                alert('Erro no servidor');
            });
        });
    }

    // Função para criar a tabela de jogos
    function createGamesTable() {
        console.log("Criando tabela de jogos");
        if (gamesTableBody) {
            const rowsHtml = Array.from({ length: 10 }, (_, index) => `
                <tr>
                    <td><select class="team-select"><option value="">Selecione o time</option></select></td>
                    <td><select class="team-select"><option value="">Selecione o time</option></select></td>
                </tr>
            `).join('');
            gamesTableBody.innerHTML = rowsHtml;
            populateSelectBoxes();
        }
    }

    // Função para popular os selects da tabela com os times
    function populateSelectBoxes() {
        console.log("Populando select boxes");
        fetch('/times')
            .then(response => {
                console.log("Resposta da API /times recebida");
                if (response.status === 401) {
                    redirecionarParaLogin();
                    throw new Error('Usuário não autenticado');
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    console.log("Times recebidos:", data);
                    const optionsHtml = data.map(time => `<option value="${time.id}">${time.nome}</option>`).join('');
                    const selects = document.querySelectorAll('.team-select');
                    selects.forEach(select => {
                        select.innerHTML = `<option value="">Selecione o time</option>${optionsHtml}`;
                    });
                } else {
                    console.error('Erro ao carregar os times: dados inválidos recebidos.');
                }
            })
            .catch(error => console.error('Erro ao carregar os times:', error));
    }

    // Função para atualizar os cards de apostas
    const atualizarApostas = () => {
        console.log("Atualizando apostas");
        if (cardsContainer) {
            cardsContainer.innerHTML = '';

            const mandanteIds = [];
            const visitanteIds = [];
            const mandanteNomes = [];
            const visitanteNomes = [];

            document.querySelectorAll('.team-select').forEach((select, index) => {
                const selectedValue = select.value;
                const selectedText = select.options[select.selectedIndex].text;
                console.log(`Selecionado: ${selectedText} (ID: ${selectedValue})`);
                if (selectedValue) {
                    if (index % 2 === 0) {
                        mandanteIds.push(selectedValue);
                        mandanteNomes.push(selectedText);
                    } else {
                        visitanteIds.push(selectedValue);
                        visitanteNomes.push(selectedText);
                    }
                }
            });

            const flag = flagSelect ? flagSelect.value : 'Moderado';
            console.log("Flag selecionada:", flag);

            const requests = [];

            mandanteIds.forEach((mandanteId, index) => {
                const visitanteId = visitanteIds[index];
                const visitanteNome = visitanteNomes[index] || 'Visitante Não Selecionado';
                const mandanteNome = mandanteNomes[index];

                console.log(`Processando: ${mandanteNome} x ${visitanteNome}`);

                const paramsMandante = new URLSearchParams({
                    mandante_ids: JSON.stringify([mandanteId]),
                    flag: flag
                });

                const paramsVisitante = new URLSearchParams({
                    visitante_ids: JSON.stringify([visitanteId]),
                    flag: flag
                });

                const mandantePromise = golsMandanteButton.classList.contains("active")
                    ? fetch(`/mercado-gols-mandante?${paramsMandante.toString()}`, {
                          method: 'GET',
                          headers: { 'Content-Type': 'application/json' },
                      }).then((response) => {
                          if (response.status === 401) {
                              redirecionarParaLogin();
                              throw new Error('Usuário não autenticado');
                          }
                          return response.json();
                      })
                      .catch(error => {
                          console.error('Erro ao buscar dados do mandante:', error);
                          return null;
                      })
                    : Promise.resolve(null);

                const escanteiosMandantePromise = escanteiosMandanteButton.classList.contains("active")
                    ? fetch(`/mercado-escanteios-mandante?${paramsMandante.toString()}`, {
                          method: 'GET',
                          headers: { 'Content-Type': 'application/json' },
                      }).then((response) => {
                          if (response.status === 401) {
                              redirecionarParaLogin();
                              throw new Error('Usuário não autenticado');
                          }
                          return response.json();
                      })
                      .catch(error => {
                          console.error('Erro ao buscar dados dos escanteios mandante:', error);
                          return null;
                      })
                    : Promise.resolve(null);

                const visitantePromise = golsVisitanteButton.classList.contains("active")
                    ? fetch(`/mercado-gols-visitante?${paramsVisitante.toString()}`, {
                          method: 'GET',
                          headers: { 'Content-Type': 'application/json' },
                      }).then((response) => {
                          if (response.status === 401) {
                              redirecionarParaLogin();
                              throw new Error('Usuário não autenticado');
                          }
                          return response.json();
                      })
                      .catch(error => {
                          console.error('Erro ao buscar dados do visitante:', error);
                          return null;
                      })
                    : Promise.resolve(null);

                requests.push(
                    Promise.all([mandantePromise, escanteiosMandantePromise, visitantePromise]).then(([mandanteData, escanteiosData, visitanteData]) => {
                        console.log("Dados recebidos para mandante:", mandanteData);
                        console.log("Dados recebidos para escanteios:", escanteiosData);
                        console.log("Dados recebidos para visitante:", visitanteData);

                        let cardHtml = `
                            <div class="card">
                                <h2 class="match-title">${mandanteNome} x ${visitanteNome}</h2>
                                <div class="header-container">
                                    <h3 class="market-title">Mercado</h3>
                                    <h3 class="stats-title">Estatísticas</h3>
                                </div>
                                <div class="card-content">
                        `;

                        if (mandanteData) {
                            mandanteData.forEach((result, i) => {
                                cardHtml += `
                                    <div class="entry">
                                        <div class="entry-header">
                                            <span class="circle"></span>
                                            <span class="entry-title">${result.entrada}</span>
                                            <span class="percentage">${result.percentual}</span>
                                        </div>
                                        <div class="team-name">${mandanteNome}</div>
                                        ${i > 0 ? '<div class="line"></div>' : ''}
                                    </div>
                                `;
                            });
                        }

                        if (escanteiosData) {
                            escanteiosData.forEach((result, i) => {
                                cardHtml += `
                                    <div class="entry">
                                        <div class="entry-header">
                                            <span class="circle"></span>
                                            <span class="entry-title">${result.entrada}</span>
                                            <span class="percentage">${result.percentual}</span>
                                        </div>
                                        <div class="team-name">${mandanteNome}</div>
                                        ${i > 0 ? '<div class="line"></div>' : ''}
                                    </div>
                                `;
                            });
                        }

                        if (visitanteData) {
                            visitanteData.forEach((result, i) => {
                                cardHtml += `
                                    <div class="entry">
                                        <div class="entry-header">
                                            <span class="circle"></span>
                                            <span class="entry-title">${result.entrada}</span>
                                            <span class="percentage">${result.percentual}</span>
                                        </div>
                                        <div class="team-name">${visitanteNome}</div>
                                        ${i > 0 ? '<div class="line"></div>' : ''}
                                    </div>
                                `;
                            });
                        }

                        cardHtml += `
                                <div class="line"></div>
                                <div class="analysis-section">
                        `;

                        if (mandanteData && golsMandanteButton.classList.contains("active")) {
                            cardHtml += `<p>Jogos Analisados Mandante: ${mandanteData[0]?.total_jogos || 0}</p>`;
                        }

                        if (escanteiosData && escanteiosMandanteButton.classList.contains("active")) {
                            cardHtml += `<p>Escanteios Analisados Mandante: ${escanteiosData[0]?.total_jogos || 0}</p>`;
                        }

                        if (visitanteData && golsVisitanteButton.classList.contains("active")) {
                            cardHtml += `<p>Jogos Analisados Visitante: ${visitanteData[0]?.total_jogos || 0}</p>`;
                        }

                        cardHtml += `
                                </div>
                            </div>
                        `;

                        cardsContainer.innerHTML += cardHtml;
                    })
                );
            });

            Promise.all(requests).then(() => {
                console.log('Todos os resultados foram carregados.');
            });
        }
    };

    // Adicionar eventos aos botões
    if (padraoButton) {
        padraoButton.addEventListener("click", () => {
            console.log("Botão Padrão clicado");
            atualizarPainelConfig("padrao");
            atualizarApostas();
        });
    }

    if (personalizadoButton) {
        personalizadoButton.addEventListener("click", () => {
            console.log("Botão Personalizado clicado");
            atualizarPainelConfig("personalizado");
            atualizarApostas();
        });
    }

    if (atualizarButton) {
        atualizarButton.addEventListener("click", () => {
            console.log("Botão Atualizar clicado");
            atualizarApostas();
        });
    }

    if (golsMandanteButton) {
        golsMandanteButton.addEventListener("click", () => {
            console.log("Botão Gols Mandante clicado");
            golsMandanteButton.classList.toggle("active");
        });
    }

    if (golsVisitanteButton) {
        golsVisitanteButton.addEventListener("click", () => {
            console.log("Botão Gols Visitante clicado");
            golsVisitanteButton.classList.toggle("active");
        });
    }

    if (escanteiosMandanteButton) {
        escanteiosMandanteButton.addEventListener("click", () => {
            console.log("Botão Escanteios Mandante clicado");
            escanteiosMandanteButton.classList.toggle("active");
        });
    }

    if (runBacktestButton) {
        runBacktestButton.addEventListener("click", () => {
            const marketType = document.getElementById("marketTypeSelect").value;
            const startDate = document.getElementById("startDateInput").value;
            const endDate = document.getElementById("endDateInput").value;

            console.log(`Executando backtest para ${marketType} de ${startDate} até ${endDate}`);
        });
    }

    if (backtestButton) {
        backtestButton.addEventListener("click", () => {
            console.log("Botão Backtest clicado");
            // Redireciona para a página de backtesting
            window.location.href = '/backtesting';
        });
    }

    if (configButton) {
        configButton.addEventListener("click", () => {
            console.log("Botão Config clicado");
            // Redireciona para a página de configuração
            window.location.href = '/config';
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("Botão Logout clicado");
            mainContainer.classList.add("fade-out");
            setTimeout(() => {
                fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro no logout');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        console.log("Logout bem-sucedido");
                        window.location.href = '/login';
                    } else {
                        console.error('Logout falhou: ' + data.message);
                        alert('Erro ao fazer logout: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Erro no servidor:', error);
                    alert('Erro no servidor');
                });
            }, 1000);
        });
    }

    console.log("Inicializando painel padrão e tabela de jogos");
    atualizarPainelConfig("padrao");
    createGamesTable();
});
