ALTER TABLE taxa_cdi
    ADD COLUMN proxima_reuniao_copom DATE NULL DEFAULT NULL
        COMMENT 'Data da próxima reunião do COPOM que pode alterar a taxa';
