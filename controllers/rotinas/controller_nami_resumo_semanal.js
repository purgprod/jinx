// controllers/rotinas/controller_nami_resumo_semanal.js
const logger             = require('../../logger');
const ResumoSemanalModel = require('../../models/rotinas/model_resumo_semanal');
const NotificacoesModel  = require('../../models/webhook/model_notificacoes');

const NamiResumoSemanalController = {
    async executar(req, res) {
        try {
            logger.info('[Nami] Iniciando geração de resumos semanais');

            const usuarios = await ResumoSemanalModel.buscarUsuariosAtivos();

            if (!usuarios || usuarios.length === 0) {
                logger.warn('[Nami] Nenhum usuário ativo encontrado para resumo semanal');
                return res.status(200).json({ message: 'Rotinas executadas com sucesso', enfileirados: 0 });
            }

            let enfileirados = 0;
            let erros = 0;

            for (const usuario of usuarios) {
                const { usuario_id } = usuario;
                try {
                    const [
                        rendimentoTotal,
                        rendimentoSemana,
                        depositosSemana,
                        saquesSemana,
                        proximaMeta,
                    ] = await Promise.all([
                        ResumoSemanalModel.buscarRendimentoTotal(usuario_id),
                        ResumoSemanalModel.buscarRendimentoSemana(usuario_id),
                        ResumoSemanalModel.buscarDepositosSemana(usuario_id),
                        ResumoSemanalModel.buscarSaquesSemana(usuario_id),
                        ResumoSemanalModel.buscarProximaMeta(usuario_id),
                    ]);

                    const investido = parseFloat(usuario.investido) || 0;
                    const rendSemana = parseFloat(rendimentoSemana) || 0;
                    const rendPercentual = investido > 0
                        ? ((rendSemana / investido) * 100).toFixed(2)
                        : '0.00';

                    const metaInvestir   = parseFloat(proximaMeta?.objetivo_investir) || 0;
                    const metaAlocado    = parseFloat(proximaMeta?.saldo_alocado) || 0;
                    const metaFinanceiro = metaInvestir > 0
                        ? (metaInvestir - metaAlocado).toFixed(2)
                        : null;
                    const metaPercentual = metaInvestir > 0
                        ? ((metaAlocado / metaInvestir) * 100).toFixed(2)
                        : null;

                    const payload = {
                        apelido:                      usuario.apelido,
                        saldo:                        parseFloat(usuario.saldo).toFixed(2),
                        investido:                    investido.toFixed(2),
                        rendimento_semana:            rendSemana.toFixed(2),
                        rendimento_percentual:        rendPercentual,
                        rendimento_total:             parseFloat(rendimentoTotal).toFixed(2),
                        depositos_semana:             parseFloat(depositosSemana).toFixed(2),
                        saques_semana:                parseFloat(saquesSemana).toFixed(2),
                        posicao_ranking:              usuario.posicao_ranking ?? null,
                        pontos_total:                 usuario.pontos_total,
                        liga:                         usuario.liga,
                        objetivo_valor_total:         proximaMeta ? parseFloat(proximaMeta.objetivo_valor_total).toFixed(2) : null,
                        saldo_alocado_total:          proximaMeta ? parseFloat(proximaMeta.saldo_alocado_total).toFixed(2) : null,
                        objetivo_percentual_alcancado: proximaMeta && parseFloat(proximaMeta.objetivo_valor_total) > 0
                            ? ((parseFloat(proximaMeta.saldo_alocado_total) / parseFloat(proximaMeta.objetivo_valor_total)) * 100).toFixed(2)
                            : null,
                        proxima_meta_data:            proximaMeta?.data_limite ?? null,
                        proxima_meta_bruta_financeiro: metaInvestir > 0 ? metaInvestir.toFixed(2) : null,
                        proxima_meta_financeiro:      metaFinanceiro,
                        proxima_meta_percentual:      metaPercentual,
                    };

                    await NotificacoesModel.criar(usuario_id, 'resumo_semanal', payload);
                    enfileirados++;
                    logger.info(`[Nami] Resumo semanal enfileirado para usuario_id=${usuario_id}`);
                } catch (errUsuario) {
                    erros++;
                    logger.error(`[Nami] Erro ao processar resumo semanal para usuario_id=${usuario_id}:`, errUsuario);
                }
            }

            logger.info(`[Nami] Resumo semanal concluído — enfileirados=${enfileirados}, erros=${erros}`);
            return res.status(200).json({ message: 'Rotinas executadas com sucesso', enfileirados, erros });

        } catch (error) {
            logger.error('[Nami] Erro inesperado no resumo semanal:', error);
            return res.status(500).json({ error: 'Erro interno', message: 'Erro inesperado durante o resumo semanal' });
        }
    },
};

module.exports = NamiResumoSemanalController;
