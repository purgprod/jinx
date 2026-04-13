// DEAD CODE — não utilizado em nenhum controller.
//
// Histórico: tentava fazer SET emblemas = 0, saldo = ? em carteiras, mas a coluna
// 'emblemas' nunca existiu (ou foi removida) dessa tabela. O rendimento de Pins de
// Emblema é pago diretamente em carteiras.saldo pela rotina poppy-pagamento-rendimento-diario
// após o poppy-pagamento-emblema-diario calcular o rendimento_token em usuario_tokens.
//
// Mantido apenas para rastreabilidade do histórico de decisões de design.

const ConverterEmblemasModel = {};
module.exports = ConverterEmblemasModel;

