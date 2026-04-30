-- migrations/criar_tabelas_modo_familia.sql
-- Modo Família: tabelas de relacionamentos, convites, permissões e log de acessos.

-- Relacionamentos ativos entre guardiões e tutelados
CREATE TABLE IF NOT EXISTS familia_relacionamentos (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    guardiao_id        INT NOT NULL,
    tutelado_id        INT NOT NULL,
    status             ENUM('ativo', 'revogado') NOT NULL DEFAULT 'ativo',
    token_acesso_hash  VARCHAR(128) NOT NULL,
    criado_em          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_par (guardiao_id, tutelado_id),
    INDEX idx_guardiao (guardiao_id),
    INDEX idx_tutelado (tutelado_id)
);

-- Convites pendentes enviados pelos guardiões
CREATE TABLE IF NOT EXISTS familia_convites (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    guardiao_id      INT NOT NULL,
    email_convidado  VARCHAR(255) NOT NULL,
    token_convite    VARCHAR(128) NOT NULL,
    status           ENUM('pendente', 'aceito', 'expirado', 'cancelado') NOT NULL DEFAULT 'pendente',
    expira_em        DATETIME NOT NULL,
    criado_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_token (token_convite),
    INDEX idx_guardiao (guardiao_id),
    INDEX idx_email (email_convidado)
);

-- Permissões unificadas por tutelado (compartilhadas entre ambos os guardiões)
CREATE TABLE IF NOT EXISTS familia_permissoes (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    tutelado_id             INT NOT NULL UNIQUE,
    pode_sacar              TINYINT(1) NOT NULL DEFAULT 0,
    chaves_pix_autorizadas  JSON NOT NULL DEFAULT ('[]'),
    pode_depositar          TINYINT(1) NOT NULL DEFAULT 1,
    pode_criar_objetivos    TINYINT(1) NOT NULL DEFAULT 1,
    pode_alterar_perfil     TINYINT(1) NOT NULL DEFAULT 0,
    pode_alterar_pix        TINYINT(1) NOT NULL DEFAULT 0,
    atualizado_em           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tutelado (tutelado_id)
);

-- Log interno de acessos de guardiões à conta de tutelados (auditoria — invisível ao tutelado)
CREATE TABLE IF NOT EXISTS familia_acessos_log (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    guardiao_id  INT NOT NULL,
    tutelado_id  INT NOT NULL,
    acao         VARCHAR(100) NOT NULL DEFAULT 'acesso_perfil',
    criado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guardiao (guardiao_id),
    INDEX idx_tutelado (tutelado_id)
);
