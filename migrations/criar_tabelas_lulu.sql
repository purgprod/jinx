-- migrations/criar_tabelas_lulu.sql
-- Cria todas as tabelas do sistema Lulu de amortização de taxa de cartão.

-- Configurações globais (única linha, id=1 fixo)
CREATE TABLE IF NOT EXISTS lulu_config (
    id                     INT          NOT NULL DEFAULT 1 PRIMARY KEY,
    percentual_deducao     DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    taxa_cartao_percentual DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    atualizado_em          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO lulu_config (id, percentual_deducao, taxa_cartao_percentual)
VALUES (1, 10.00, 2.00);

-- Taxa individual por cobrança de cartão aprovada
CREATE TABLE IF NOT EXISTS lulu_taxas (
    id                 INT           AUTO_INCREMENT PRIMARY KEY,
    usuario_id         INT           NOT NULL,
    cobranca_cartao_id INT           NOT NULL,
    valor_taxa         DECIMAL(10,2) NOT NULL,
    valor_recuperado   DECIMAL(20,8) NOT NULL DEFAULT 0,
    status             VARCHAR(20)   NOT NULL DEFAULT 'Ativa',
    criado_em          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario_status (usuario_id, status),
    CONSTRAINT fk_lulu_taxas_usuario  FOREIGN KEY (usuario_id)         REFERENCES users(usuario_id),
    CONSTRAINT fk_lulu_taxas_cobranca FOREIGN KEY (cobranca_cartao_id) REFERENCES cobrancas_cartao(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Auditoria: cada dedução diária por taxa
CREATE TABLE IF NOT EXISTS lulu_deducoes (
    id             INT           AUTO_INCREMENT PRIMARY KEY,
    taxa_id        INT           NOT NULL,
    usuario_id     INT           NOT NULL,
    valor_deduzido DECIMAL(20,8) NOT NULL,
    criado_em      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_taxa    (taxa_id),
    INDEX idx_usuario (usuario_id),
    CONSTRAINT fk_lulu_deducoes_taxa FOREIGN KEY (taxa_id) REFERENCES lulu_taxas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Snapshot diário para os gráficos do painel Jinx
CREATE TABLE IF NOT EXISTS lulu_historico_diario (
    id             INT           AUTO_INCREMENT PRIMARY KEY,
    data           DATE          NOT NULL UNIQUE,
    total_pendente DECIMAL(20,8) NOT NULL DEFAULT 0,
    total_usuarios INT           NOT NULL DEFAULT 0,
    criado_em      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rotinas Lulu no painel de manutenção
INSERT IGNORE INTO rotinas (id, hora_agendada, descricao, status_execucao, usuario, status_ativo)
VALUES
  (15, '00:01:00', '[Lulu] Amortização diária de taxa de cartão',    'PENDENTE', 'Sistema', 1),
  (16, '00:01:00', '[Lulu] Snapshot diário do painel',               'PENDENTE', 'Sistema', 1);
