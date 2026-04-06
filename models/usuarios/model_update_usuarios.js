const mysql = require('mysql2');
const bcrypt = require('bcrypt'); 
const connection = require('../../database/database_purg');
const logger = require('../../logger');

class UsersUpdateModel {

    // Método para atualizar um usuário
    static async updateUsuario(id, data) {
        const sqlQuery = `
            UPDATE users
            SET email = ?, assinatura = ?, data_ultima_alteracao_assinatura = ?, nome = ?, nome_completo = ?, cpf = ?, nome_da_mae = ?, genero = ?, celular = ?, estado = ?, cidade = ?, cep =?, bairro = ?, logradouro = ?, numero_da_rua = ?, complemento = ?, pix_cpf = ?, pix_celular = ?, pix_email = ?, pix_chave =?, termos_de_uso = ?, data_nascimento = ?
            WHERE usuario_id = ?
        `;
        const values = [data.email, data.assinatura, data.data_ultima_alteracao_assinatura, data.nome, data.nome_completo, data.cpf, data.nome_da_mae, data.genero, data.celular, data.estado, data.cidade, data.cep, data.bairro, data.logradouro, data.numero_da_rua, data.complemento, data.pix_cpf, data.pix_celular, data.pix_email, data.pix_chave, data.termos_de_uso, data.data_nascimento, id];

        // Logando as informações do usuário que serão atualizadas
        logger.info(`Executando update para usuario com ID: ${id}`);
        logger.info(`Dados a serem enviados: ${JSON.stringify(data)}`);

        return new Promise((resolve, reject) => {
            connection.query(sqlQuery, values, (error, results) => {
                if (error) {
                    logger.error(`Erro ao atualizar usuario com ID: ${id} - ${error.message}`);
		    reject(error);
                } else {
                    logger.info(`Usuário com ID: ${id} atualizado com sucesso.`);
                    resolve(results);
                }
            });
        });
    }
}

module.exports = UsersUpdateModel;

