// Alocação de carteira por combinação de suitability + suitability_complementar
//
// porcentagem_empresas  → % do saldo que vai para Pins de Empresas
// porcentagem_emblemas  → % do saldo que vai para Pins de Emblema (tipo EMB)
//
// Dentro da parcela de Empresas, as proporções conservador/moderado/agressivo
// indicam como esse valor é distribuído entre os perfis de risco disponíveis.
//
// Regra geral:
//   Perfil mais conservador → maior peso em EMB (renda fixa)
//   Perfil mais agressivo   → maior peso em Empresas (renda variável)

const carteiras = [
    {
        "suitability": "Conservador",
        "suitability_complementar": "Conservador",
        "porcentagem_empresas": 25,
        "porcentagem_emblemas": 75,
        "porcentagem_pin_conservador": 95,
        "porcentagem_pin_moderado": 4,
        "porcentagem_pin_agressivo": 1
    },
    {
        "suitability": "Conservador",
        "suitability_complementar": "Moderado",
        "porcentagem_empresas": 35,
        "porcentagem_emblemas": 65,
        "porcentagem_pin_conservador": 90,
        "porcentagem_pin_moderado": 9,
        "porcentagem_pin_agressivo": 1
    },
    {
        "suitability": "Conservador",
        "suitability_complementar": "Agressivo",
        "porcentagem_empresas": 45,
        "porcentagem_emblemas": 55,
        "porcentagem_pin_conservador": 80,
        "porcentagem_pin_moderado": 12,
        "porcentagem_pin_agressivo": 8
    },
    {
        "suitability": "Moderado",
        "suitability_complementar": "Conservador",
        "porcentagem_empresas": 40,
        "porcentagem_emblemas": 60,
        "porcentagem_pin_conservador": 9,
        "porcentagem_pin_moderado": 90,
        "porcentagem_pin_agressivo": 1
    },
    {
        "suitability": "Moderado",
        "suitability_complementar": "Moderado",
        "porcentagem_empresas": 55,
        "porcentagem_emblemas": 45,
        "porcentagem_pin_conservador": 1,
        "porcentagem_pin_moderado": 90,
        "porcentagem_pin_agressivo": 9
    },
    {
        "suitability": "Moderado",
        "suitability_complementar": "Agressivo",
        "porcentagem_empresas": 65,
        "porcentagem_emblemas": 35,
        "porcentagem_pin_conservador": 1,
        "porcentagem_pin_moderado": 80,
        "porcentagem_pin_agressivo": 19
    },
    {
        "suitability": "Agressivo",
        "suitability_complementar": "Conservador",
        "porcentagem_empresas": 65,
        "porcentagem_emblemas": 35,
        "porcentagem_pin_conservador": 5,
        "porcentagem_pin_moderado": 25,
        "porcentagem_pin_agressivo": 70
    },
    {
        "suitability": "Agressivo",
        "suitability_complementar": "Moderado",
        "porcentagem_empresas": 75,
        "porcentagem_emblemas": 25,
        "porcentagem_pin_conservador": 1,
        "porcentagem_pin_moderado": 18,
        "porcentagem_pin_agressivo": 80
    },
    {
        "suitability": "Agressivo",
        "suitability_complementar": "Agressivo",
        "porcentagem_empresas": 85,
        "porcentagem_emblemas": 15,
        "porcentagem_pin_conservador": 1,
        "porcentagem_pin_moderado": 9,
        "porcentagem_pin_agressivo": 90
    }
];

module.exports = carteiras;
