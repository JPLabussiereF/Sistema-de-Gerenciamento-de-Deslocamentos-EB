document.addEventListener('DOMContentLoaded', function () {
    const btnLogin = document.getElementById('btnLogin');
    const inputIdentificador = document.getElementById('usuario'); // CPF ou Email
    const inputSenha = document.getElementById('senha');
    const togglePassword = document.getElementById('togglePassword');
    const eyeIcon = document.querySelector('.eye-icon');
    const eyeSlashIcon = document.querySelector('.eye-slash-icon');
    const inputs = document.querySelectorAll('.form-input');
    const checkboxLembrar = document.getElementById('lembrarUsuario'); // Checkbox para lembrar usuário

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
        // Marca o checkbox se houver usuário salvo
        if (checkboxLembrar) {
            checkboxLembrar.checked = true;
        }
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

    // Função para mostrar mensagem de feedback
    function mostrarMensagem(tipo, titulo, mensagem) {
        // Verificar se existe um elemento modal para mensagens
        let modal = document.getElementById('mensagemModal');
        
        // Se não existir, usar alert padrão
        if (!modal) {
            alert(`${titulo}: ${mensagem}`);
            return;
        }
        
        const container = modal.querySelector('.mensagem-modal-container');
        const iconeDiv = modal.querySelector('.mensagem-modal-icone');
        const tituloEl = modal.querySelector('.mensagem-modal-titulo');
        const bodyEl = modal.querySelector('.mensagem-modal-body');
        
        // Limpar classes anteriores
        container.classList.remove('mensagem-sucesso', 'mensagem-erro');
        
        // Definir o conteúdo
        tituloEl.textContent = titulo;
        bodyEl.textContent = mensagem;
        
        // Configurar o ícone baseado no tipo
        if (tipo === 'sucesso') {
            container.classList.add('mensagem-sucesso');
            iconeDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            `;
        } else if (tipo === 'erro') {
            container.classList.add('mensagem-erro');
            iconeDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            `;
        }
        
        // Mostrar o modal
        modal.style.display = 'flex';
        
        // Adicionar classe 'ativo' após um pequeno atraso para ter efeito de animação
        setTimeout(() => {
            container.classList.add('ativo');
        }, 10);
    }

    // Função para validar e enviar login
    function realizarLogin() {
        const usuario = document.getElementById('usuario').value.trim();
        const senha = document.getElementById('senha').value.trim();
        
        // Validação básica
        if (!usuario || !senha) {
            mostrarMensagem('erro', 'Campos Obrigatórios', 'Preencha todos os campos para fazer login.');
            return;
        }

        // Mostrar indicador de carregamento
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner"></span> Autenticando...';

        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usuario, senha }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Salvar dados do usuário no localStorage para uso em outras páginas
            const usuarioLogado = {
                id_usuario: data.id_usuario,
                nome: data.nome,
                funcao: data.funcao
            };
            
            // Armazenar os dados do usuário logado no localStorage
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            
            // Se a opção "Lembrar usuário" estiver marcada, salvar também o identificador
            if (checkboxLembrar && checkboxLembrar.checked) {
                localStorage.setItem('lembrarUsuario', usuario);
            } else {
                localStorage.removeItem('lembrarUsuario');
            }
            
            // Mostrar mensagem de sucesso antes de redirecionar
            mostrarMensagem('sucesso', 'Login realizado', 'Você será redirecionado em instantes...');
            
            // Redirecionar após um pequeno delay
            setTimeout(() => {
                // Redirecionar de acordo com a função do usuário
                if (data.funcao === 'adm') {
                    window.location.href = 'cadastro-cliente.html';
                } else if (data.funcao === 'vendedor') {
                    window.location.href = 'deslocamento.html';
                } else {
                    mostrarMensagem('erro', 'Acesso Negado', 'Seu perfil não possui permissão para acessar o sistema.');
                }
            }, 1500);
        })
        .catch(error => {
            console.error('Erro ao fazer login:', error);
            mostrarMensagem('erro', 'Falha na Autenticação', 'Usuário ou senha inválidos. Verifique suas credenciais.');
            
            // Resetar botão
            btnLogin.disabled = false;
            btnLogin.innerHTML = 'Entrar';
        });
    }

    // Função para verificar se a tecla Enter foi pressionada
    function verificaTeclaEnter(event) {
        if (event.key === 'Enter') {
            realizarLogin();
        }
    }

    // Função para fechar o modal de mensagem (se existir)
    window.fecharModal = function() {
        const modal = document.getElementById('mensagemModal');
        if (modal) {
            const container = modal.querySelector('.mensagem-modal-container');
            
            // Adicionar classe 'fechando' para animar a saída
            container.classList.remove('ativo');
            container.classList.add('fechando');
            
            // Esperar a animação terminar antes de esconder o modal
            setTimeout(() => {
                modal.style.display = 'none';
                container.classList.remove('fechando');
            }, 300);
        }
    };
});