const bcrypt = require('bcrypt');

const senha = 'ae123';
const hashArmazenado = '$2b$10$3HGylYseWR38F/LdR7D37upw7HgJTMPgM3Es9jqAy6wS9LgNiEAiC'; // Hash armazenado

bcrypt.compare(senha, hashArmazenado, (err, isMatch) => {
    if (err) {
        console.error('Erro ao comparar a senha:', err);
    } else if (isMatch) {
        console.log('As senhas correspondem.');
    } else {
        console.log('As senhas não correspondem.');
    }
});
