// Limpa o container principal e atualiza o conteúdo dos cartões
function loadAssinaturasResults() {
    const centerPanel = document.querySelector('.center-panel'); // Use o nome correto do container
    if (centerPanel) {
        // Limpa o conteúdo existente no centerPanel
        centerPanel.innerHTML = '';

        // Cria um novo container para os cartões
        const cardsContainer = document.createElement('div');
        cardsContainer.classList.add('cards-container');
        centerPanel.appendChild(cardsContainer);

        // Preenche o novo container com os cartões fixos
        cardsContainer.innerHTML = createFixedCardsHTML();

        // Adiciona eventos de clique aos novos cartões
        addCardEventListeners();
    }
}

// Cria a estrutura HTML dos cartões fixos
function createFixedCardsHTML() {
    const fixedCards = [
        "Poppy Pro",
        "Nexoos",
        "Taxa de Liquidez",
        "Investimentos"
    ];

    return fixedCards.map(cardTitle => `
        <div class="card" data-title="${cardTitle}">
            <h3 class="card-title">${cardTitle}</h3>
        </div>
    `).join('');
}

// Função para adicionar eventos de clique nos cartões
function addCardEventListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const cardTitle = card.getAttribute('data-title');
            alert(`Card "${cardTitle}" clicado!`);
        });
    });
}

// Torna a função acessível no escopo global
window.loadAssinaturasResults = loadAssinaturasResults;

