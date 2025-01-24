// resetar_senha.js

function resetarSenha(usuario_id) {
    // Enviar requisição para redefinir a senha do usuário
    fetch(`/api/usuarios/${usuario_id}/resetar-senha`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Senha redefinida com sucesso!');
            // Você pode opcionalmente recarregar a página ou fazer algo mais
            location.reload(); // Recarrega a página
        } else {
            alert('Erro ao redefinir a senha.');
        }
    })
    .catch(error => {
        console.error('Erro ao redefinir a senha:', error);
        alert('Erro ao redefinir a senha.');
    });
}

