// Função para formatar datas no formato yyyy-MM-dd
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadFinancialDetails(idResultado) {
    const data = financialDataMap[idResultado];
    if (data) {
        const centerPanel = document.querySelector('.center-panel');
        if (centerPanel) {
            centerPanel.innerHTML = `
                <h2>Detalhes do Resultado Financeiro ${data.razao_social}</h2>
                <form id="financialDetailsForm">
                    ${generateInputFields(data)}
                    <div class="button-container">
                        <button type="button" id="editButton" class="button-azul">Editar</button>
                        <button type="submit" id="saveButton" class="button-azul">Salvar</button>
                        ${data.status_ativo === 0 ? `
                            <button type="button" id="ativarButton" class="button-verde">Ativar</button>
                        ` : `
                            <button type="button" id="inativarButton" class="button-vermelho">Inativar</button>
                        `}
                    </div>
                </form>
            `;
            setupEventListenersResultados(idResultado);
        } else {
            console.error('Elemento center-panel não encontrado.');
        }
    } else {
        console.error('Dados não encontrados para o ID:', idResultado);
    }
}

// Gerar campos de entrada HTML a partir dos dados
function generateInputFields(data) {
    return `
        <label for="razao_social">Razão Social:</label>
        <input type="text" id="razao_social" name="razao_social" value="${data.razao_social}" readonly>

        <label for="data_criacao">Data de Criação:</label>
        <input type="text" id="data_criacao" name="data_criacao" value="${formatDate(data.data_criacao)}" readonly>

        <label for="cnpj">CNPJ:</label>
        <input type="text" id="cnpj" name="cnpj" value="${data.cnpj}" readonly>

        <label for="tipo_de_sociedade">Tipo de Sociedade:</label>
        <input type="text" id="tipo_de_sociedade" name="tipo_de_sociedade" value="${data.tipo_de_sociedade}" readonly>

        <label for="cnae_principal">CNAE Principal:</label>
        <input type="text" id="cnae_principal" name="cnae_principal" value="${data.cnae_principal}" readonly>

        <label for="capital_social">Capital Social:</label>
        <input type="number" id="capital_social" name="capital_social" value="${data.capital_social}" readonly>

        <label for="data_de_fundacao">Data de Fundação:</label>
        <input type="date" id="data_de_fundacao" name="data_de_fundacao" value="${formatDate(data.data_de_fundacao)}" readonly>

        <label for="valor_financiamento_total">Valor Financiamento Total:</label>
        <input type="number" id="valor_financiamento_total" name="valor_financiamento_total" value="${data.valor_financiamento_total}" readonly>

        <label for="valor_financiado_purg">Valor Financiado Purg:</label>
        <input type="number" id="valor_financiado_purg" name="valor_financiado_purg" value="${data.valor_financiado_purg}" readonly>

        <label for="juros_a_a">Rentabilidade a.a:</label>
        <input type="number" step="0.01" id="juros_a_a" name="juros_a_a" value="${data.juros_a_a}" readonly>

        <label for="vencimento">Vencimento:</label>
        <input type="date" id="vencimento" name="vencimento" value="${formatDate(data.vencimento)}" readonly>

        <label for="risco">Risco:</label>
        <input type="text" id="risco" name="risco" value="${data.risco}" readonly>

        <label for="prazo">Prazo:</label>
        <input type="number" id="prazo" name="prazo" value="${data.prazo}" readonly>

        <label for"ir">Imposto de Renda:</label>
	<input type="number" id="ir" name="ir" value="${data.ir}" readonly>

	<label for="resultado_financeiro">Resultado Financeiro:</label>
        <input type="number" id="resultado_financeiro" name="resultado_financeiro" value="${data.resultado_financeiro}" readonly>

        <label for="motivo_da_captacao">Motivo da Captação:</label>
        <textarea id="motivo_da_captacao" name="motivo_da_captacao" readonly>${data.motivo_da_captacao}</textarea>    

        <label for="descritivo">Descritivo:</label>
        <textarea id="descritivo" name="descritivo" readonly>${data.descritivo}</textarea>

        <label for="garantias_oferecidas">Garantias Oferecidas:</label>
        <textarea id="garantias_oferecidas" name="garantias_oferecidas" readonly>${data.garantias_oferecidas}</textarea>

        <label for="historico_com_nexoos">Histórico com Nexoos:</label>
        <textarea id="historico_com_nexoos" name="historico_com_nexoos" readonly>${data.historico_com_nexoos}</textarea>

        <label for="capital_e_capacidade">Capital e Capacidade:</label>
        <textarea id="capital_e_capacidade" name="capital_e_capacidade" readonly>${data.capital_e_capacidade}</textarea>

        <label for="carater">Caráter:</label>
        <textarea id="carater" name="carater" readonly>${data.carater}</textarea>

        <label for="credito">Crédito:</label>
        <textarea id="credito" name="credito" readonly>${data.credito}</textarea>

        <label for="condicoes">Condições:</label>
        <textarea id="condicoes" name="condicoes" readonly>${data.condicoes}</textarea>

        <label for="conexoes">Conexões:</label>
        <textarea id="conexoes" name="conexoes" readonly>${data.conexoes}</textarea>

        <label for="colateral">Colateral:</label>
        <textarea id="colateral" name="colateral" readonly>${data.colateral}</textarea>

        <label for="controle">Controle:</label>
        <textarea id="controle" name="controle" readonly>${data.controle}</textarea>

        <label for="crescimento_12_meses">Crescimento 12 Meses:</label>
        <input type="number" step="0.01" id="crescimento_12_meses" name="crescimento_12_meses" value="${data.crescimento_12_meses}" readonly>

        <label for="perfil_das_receitas">Perfil das Receitas:</label>
        <textarea id="perfil_das_receitas" name="perfil_das_receitas" readonly>${data.perfil_das_receitas}</textarea>

        <label for="site">Site:</label>
        <input type="url" id="site" name="site" value="${data.site}" readonly>

        <label for="facebook">Facebook:</label>
        <input type="url" id="facebook" name="facebook" value="${data.facebook}" readonly>

        <label for="instagram">Instagram:</label>
        <input type="url" id="instagram" name="instagram" value="${data.instagram}" readonly>

	<label for="cobertura_sinistro">Cobertura Sinistro:</label>
        <input type="number" id="cobertura_sinistro" name="cobertura_sinistro" value="${data.cobertura_sinistro}" readonly>

        <label for="flag_sinistro">Flag Sinistro:</label>
        <input type="number" id="flag_sinistro" name="flag_sinistro" value="${data.flag_sinistro}" readonly>

        <label for="data_sinistro">Data Sinistro:</label>
        <input type="date" id="data_sinistro" name="data_sinistro" value="${formatDate(data.data_sinistro)}" readonly>

        <label for="status_ativo">Status Ativo:</label>
        <input type="number" id="status_ativo" name="status_ativo" value="${data.status_ativo}" readonly>
    `;
}

function setupEventListenersResultados(idResultado) {
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.addEventListener('click', () => {
            document.querySelectorAll('#financialDetailsForm input, #financialDetailsForm textarea').forEach(element => {
                element.removeAttribute('readonly');
            });
        });
    } else {
        console.error('Botão Editar não encontrado.');
    }

    const form = document.getElementById('financialDetailsForm');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const updatedData = Object.fromEntries(formData.entries());
            
            // Atualiza valores vazios para null
            for (let key in updatedData) {
                if (updatedData[key] === '') {
                    updatedData[key] = null;
                }
            }

            console.log('Dados do formulário a serem enviados:', updatedData);

            fetch(`/api/resultados-financeiros/${idResultado}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            })
            .then(response => {
                if (response.ok) {
                    alert('Resultado financeiro atualizado com sucesso!');
                    refreshPage(); // Recarregar a página após a atualização
                    return response.json();
                } else {
                    return response.json().then(data => Promise.reject(data));
                }
            })
            .catch(error => {
                console.error('Erro ao atualizar o resultado financeiro:', error);
                alert('Erro ao atualizar o resultad o financeiro.');
            });
        });
    } else {
        console.error('Formulário não encontrado.');
    }

    setupToggleActivationResultadosButton(idResultado, 'ativar', 'ativar');
    setupToggleActivationResultadosButton(idResultado, 'inativar', 'inativar');
}

// Função para recarregar a página
function refreshPage() {
    location.reload(); // Recarrega a página inteira
}

// Configura botão para ativar/inativar
function setupToggleActivationResultadosButton(idResultado, buttonId, action) {
    const button = document.getElementById(buttonId + 'Button');
    if (button) {
        button.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja ${action} este resultado financeiro?`)) {
                fetch(`/api/resultados-financeiros/${idResultado}/${action}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                })
                .then(response => {
                    if (response.ok) {
                        alert(`Resultado financeiro ${action} com sucesso!`);
                        refreshPage(); // Recarregar a página após ativação/inativação
                    } else {
                        return response.json().then(data => Promise.reject(data));
                    }
                })
                .catch(error => {
                    console.error(`Erro ao ${action} o resultado financeiro:`, error);
                    alert(`Erro ao ${action} o resultado financeiro.`);
                });
            }
        });
    }
}

