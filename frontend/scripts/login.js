document.addEventListener('DOMContentLoaded', function () {
    const btnLogin = document.getElementById('btnLogin');
    const inputIdentificador = document.getElementById('usuario'); // CPF ou Email
    const inputSenha = document.getElementById('senha');
    const togglePassword = document.getElementById('togglePassword');
    const eyeIcon = document.querySelector('.eye-icon');
    const eyeSlashIcon = document.querySelector('.eye-slash-icon');
    const inputs = document.querySelectorAll('.form-input');

    // Adiciona atributo placeholder vazio para funcionar com o CSS
    inputIdentificador.setAttribute('placeholder', ' ');
    inputSenha.setAttribute('placeholder', ' ');

    // Função para ativar a label flutuante
    function activateFloatingLabel(input) {
        const label = input.nextElementSibling; // Pega a label associada ao input
        if (label && label.classList.contains('form-label')) {
            label.classList.add('active');
        }
    }

    // Função para resetar a label
    function resetFloatingLabel(input) {
        const label = input.nextElementSibling; // Pega a label associada ao input
        if (label && label.classList.contains('form-label')) {
            label.classList.remove('active');
        }
    }

    // Adiciona eventos para ativar ou resetar a label
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            if (this.value) {
                activateFloatingLabel(this);
            } else {
                resetFloatingLabel(this);
            }
        });

        // Ativa a label se o campo já estiver preenchido (ex.: preenchimento automático)
        if (input.value) {
            activateFloatingLabel(input);
        }
    });

    // Verifica o estado dos inputs após um pequeno delay para permitir que o autofill aconteça
    setTimeout(() => {
        inputs.forEach(input => {
            if (input.value) {
                activateFloatingLabel(input);
            }
        });
    }, 100);

    // Adiciona evento de click no botão de login
    btnLogin.addEventListener('click', realizarLogin);

    // Adiciona evento de tecla Enter nos campos
    inputIdentificador.addEventListener('keypress', verificaTeclaEnter);
    inputSenha.addEventListener('keypress', verificaTeclaEnter);

    // Adiciona evento para mostrar/ocultar senha
    togglePassword.addEventListener('click', function () {
        // Alterna o tipo do campo de senha
        const type = inputSenha.getAttribute('type') === 'password' ? 'text' : 'password';
        inputSenha.setAttribute('type', type);

        // Alterna a visibilidade dos ícones
        eyeIcon.style.display = type === 'password' ? 'inline' : 'none';
        eyeSlashIcon.style.display = type === 'password' ? 'none' : 'inline';
    });

    // Verifica se há dados salvos no localStorage
    const lembrarUsuario = localStorage.getItem('lembrarUsuario');
    if (lembrarUsuario) {
        inputIdentificador.value = lembrarUsuario;
        // Simula o evento para ativar o efeito de label flutuante
        const event = new Event('input');
        inputIdentificador.dispatchEvent(event);
    }

    // Adiciona efeito de "animação" no card de login ao carregar a página
    const loginCard = document.querySelector('.login-card');
    setTimeout(() => {
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0)';
    }, 100);

    // Função para validar e enviar login
    function realizarLogin() {
        const usuario = document.getElementById('usuario').value.trim();
        const senha = document.getElementById('senha').value.trim();

        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usuario, senha }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.mensagem) {
                alert(data.mensagem); // mensagem de erro
            } else {
                if (data.funcao === 'adm') {
                    window.location.href = 'cadastro-cliente.html';
                } else if (data.funcao === 'vendedor') {
                    window.location.href = 'deslocamento.html';
                } else {
                    alert('Função desconhecida.');
                }                
            }
        })
        .catch(error => {
            console.error('Erro ao fazer login:', error);
        });
    }
    // Função para verificar se a tecla Enter foi pressionada
    function verificaTeclaEnter(event) {
        if (event.key === 'Enter') {
            realizarLogin();
        }
    }
});