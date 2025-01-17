export function loadNewFinancialDetails() {
    const centerPanel = document.querySelector('.center-panel');
    if (centerPanel) {
        centerPanel.innerHTML = `
            <h2>Novo Resultado Financeiro</h2>
            <form id="financialDetailsForm">
                <label for="razao_social">Razão Social:</label>
                <input type="text" id="razao_social" name="razao_social">

                <label for="cnpj">CNPJ:</label>
                <input type="text" id="cnpj" name="cnpj">

                <label for="tipo_de_sociedade">Tipo de Sociedade:</label>
                <input type="text" id="tipo_de_sociedade" name="tipo_de_sociedade">

                <label for="cnae_principal">CNAE Principal:</label>
                <input type="text" id="cnae_principal" name="cnae_principal">

                <label for="capital_social">Capital Social:</label>
                <input type="number" step="0.01" id="capital_social" name="capital_social">

                <label for="data_de_fundacao">Data de Fundação:</label>
                <input type="date" id="data_de_fundacao" name="data_de_fundacao">

                <label for="valor_financiamento_total">Valor Financiamento Total:</label>
                <input type="number" step="0.01" id="valor_financiamento_total" name="valor_financiamento_total">

                <label for="valor_financiado_purg">Valor Financiado Purg:</label>
                <input type="number" step="0.01" id="valor_financiado_purg" name="valor_financiado_purg">

                <label for="juros_a_a">Juros a.a:</label>
                <input type="number" step="0.01" id="juros_a_a" name="juros_a_a">

                <label for="vencimento">Vencimento:</label>
                <input type="date" id="vencimento" name="vencimento">

                <label for="risco">Risco:</label>
                <input type="text" id="risco" name="risco">

                <label for="prazo">Prazo:</label>
                <input type="number" id="prazo" name="prazo">

                <label for="resultado_financeiro">Resultado Financeiro:</label>
                <input type="number" step="0.01" id="resultado_financeiro" name="resultado_financeiro">

                <label for="motivo_da_captacao">Motivo da Captação:</label>
                <textarea id="motivo_da_captacao" name="motivo_da_captacao"></textarea>

                <label for="descritivo">Descritivo:</label>
                <textarea id="descritivo" name="descritivo"></textarea>

                <label for="garantias_oferecidas">Garantias Oferecidas:</label>
                <textarea id="garantias_oferecidas" name="garantias_oferecidas"></textarea>

                <label for="historico_com_nexoos">Histórico com Nexoos:</label>
                <textarea id="historico_com_nexoos" name="historico_com_nexoos"></textarea>

                <label for="capital_e_capacidade">Capital e Capacidade:</label>
                <textarea id="capital_e_capacidade" name="capital_e_capacidade"></textarea>

                <label for="carater">Caráter:</label>
                <textarea id="carater" name="carater"></textarea>

                <label for="credito">Crédito:</label>
                <textarea id="credito" name="credito"></textarea>

                <label for="condicoes">Condições:</label>
                <textarea id="condicoes" name="condicoes"></textarea>

                <label for="conexoes">Conexões:</label>
                <textarea id="conexoes" name="conexoes"></textarea>

                <label for="colateral">Colateral:</label>
                <textarea id="colateral" name="colateral"></textarea>

                <label for="controle">Controle:</label>
                <textarea id="controle" name="controle"></textarea>

                <label for="crescimento_12_meses">Crescimento 12 Meses:</label>
                <input type="number" step="0.01" id="crescimento_12_meses" name="crescimento_12_meses">

                <label for="perfil_das_receitas">Perfil das Receitas:</label>
                <textarea id="perfil_das_receitas" name="perfil_das_receitas"></textarea>

                <label for="site">Site:</label>
                <input type="url" id="site" name="site">

                <label for="facebook">Facebook:</label>
                <input type="url" id="facebook" name="facebook">

                <label for="instagram">Instagram:</label>
                <input type="url" id="instagram" name="instagram">

                <label for="cobertura_sinistro">Cobertura Sinistro:</label>
                <input type="number" id="cobertura_sinistro" name="cobertura_sinistro">

                <label for="flag_sinistro">Flag Sinistro:</label>
                <input type="number" id="flag_sinistro" name="flag_sinistro">

                <label for="data_sinistro">Data Sinistro:</label>
                <input type="date" id="data_sinistro" name="data_sinistro">

                <label for="status_ativo">Status Ativo:</label>
                <input type="number" id="status_ativo" name="status_ativo" value="1" readonly>

                <div class="button-group">
                    <button type="submit">Salvar</button>
                </div>
            </form>
        `;

        // Adiciona um evento de submissão ao formulário
        const form = document.getElementById('financialDetailsForm');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(form);
                const newData = Object.fromEntries(formData.entries());

                // Substitui valores vazios por null
                for (let key in newData) {
                    if (newData[key] === '') {
                        newData[key] = null;
                    }
                }

                console.log('Dados do formulário a serem enviados:', newData); // Log para verificar os dados

                // Envia os dados para o servidor
                fetch('/api/resultados-financeiros', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newData),
                })
                .then(response => {
                    if (response.ok) {
                        alert('Dados salvos com sucesso!');
                    } else {
                        response.json().then(data => {
                            console.error('Erro ao salvar os dados:', data);
                            alert('Erro ao salvar os dados.');
                        });
                    }
                })
                .catch(error => {
                    console.error('Erro ao salvar os dados:', error);
                    alert('Erro ao salvar os dados.');
                });
            });
        } else {
            console.error('Formulário não encontrado.');
        }
    } else {
        console.error('Elemento center-panel não encontrado.');
    }
}

