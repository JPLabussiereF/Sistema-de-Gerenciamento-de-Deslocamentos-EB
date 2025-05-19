document.addEventListener('DOMContentLoaded', function () {
    const btnLogin = document.getElementById('btnLogin');
    const inputUsuario = document.getElementById('usuario');
    const inputSenha = document.getElementById('senha');
    const togglePassword = document.getElementById('togglePassword');
    const eyeIcon = document.querySelector('.eye-icon');
    const eyeSlashIcon = document.querySelector('.eye-slash-icon');
    const inputs = document.querySelectorAll('.form-input');

    // Adiciona atributo placeholder vazio para funcionar com o CSS
    inputUsuario.setAttribute('placeholder', ' ');
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
    inputUsuario.addEventListener('keypress', verificaTeclaEnter);
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
        inputUsuario.value = lembrarUsuario;
        // Simula o evento para ativar o efeito de label flutuante
        const event = new Event('input');
        inputUsuario.dispatchEvent(event);
    }

    // Adiciona efeito de "animação" no card de login ao carregar a página
    const loginCard = document.querySelector('.login-card');
    setTimeout(() => {
        loginCard.style.opacity = '1';
        loginCard.style.transform = 'translateY(0)';
    }, 100);

    // Função para validar e enviar login
    function realizarLogin() {
        const usuario = inputUsuario.value.trim();
        const senha = inputSenha.value.trim();

        // Validação básica
        if (!usuario || !senha) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        // Validação de formato de CPF ou email
        if (!validarCpf(usuario)) {
            alert('Por favor, insira um CPF válido ou um email @EB');
            return;
        }

        // Aqui você pode implementar a lógica de autenticação
        console.log('Tentativa de login:', usuario);

        // Simulação de login
        alert('Login enviado com sucesso!');

        /* Exemplo de código para enviar para um servidor:
        
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: usuario,
                senha: senha
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                window.location.href = '/dashboard';
            } else {
                alert('Usuário ou senha incorretos');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao tentar fazer login');
        });
        
        */
    }

    // Função para verificar se a tecla Enter foi pressionada
    function verificaTeclaEnter(event) {
        if (event.key === 'Enter') {
            realizarLogin();
        }
    }

    // Função para validar formato de CPF
    function validarCpf(valor) {
        // Verifica se é um CPF (somente números, 11 dígitos)
        const cpfRegex = /^\d{11}$/;

        return cpfRegex.test(valor);
    }
});