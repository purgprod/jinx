// models/model_criar_novo_usuario.js
const pool = require('../database/database_purg');

// Função para criar um novo usuário
exports.createUser = (nome, cpf, celular, email, hashedPassword, callback) => {
    const query = 'INSERT INTO users (nome, cpf, celular, email, password) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [nome, cpf, celular, email, hashedPassword], (err, results) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            callback(err, null);
            return;
        }
        console.log('Usuário criado com sucesso, ID:', results.insertId);
        callback(null, results.insertId);
    });
};

