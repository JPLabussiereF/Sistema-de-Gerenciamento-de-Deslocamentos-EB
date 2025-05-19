// Script para o formulário de cadastro de cliente
document.addEventListener('DOMContentLoaded', function () {
    // Referências aos elementos do formulário
    const form = document.querySelector('.form-card');
    const btnCadastrar = document.getElementById('btnCadastrar');
    const nomeCliente = document.getElementById('nomeCliente');
    const cpfCnpj = document.getElementById('cpfCnpj');
    const responsavel = document.getElementById('responsavel');
    const cep = document.getElementById('cep');
    const cidade = document.getElementById('cidade');
    const estado = document.getElementById('estado');
    const bairro = document.getElementById('bairro');
    const logradouro = document.getElementById('logradouro');
    const numero = document.getElementById('numero');
    const complemento = document.getElementById('complemento');

    // Inicializar o estado do formulário
    inicializarFormulario();

    // Event listeners para os campos
    adicionarEventListeners();

    // Botão de cadastro
    btnCadastrar.addEventListener('click', function (e) {
        e.preventDefault();
        if (validarFormulario()) {
            enviarFormulario();
        }
    });

    // Função para inicializar o formulário
    function inicializarFormulario() {
        // Ativar os labels flutuantes para campos já preenchidos
        document.querySelectorAll('.form-input').forEach(input => {
            if (input.value) {
                activateFloatingLabel(input);
            }
        });
    }

    // Função para adicionar todos os event listeners
    function adicionarEventListeners() {
        // Eventos para ativar labels flutuantes
        document.querySelectorAll('.form-input').forEach(input => {
            ['input', 'focus', 'blur'].forEach(eventType => {
                input.addEventListener(eventType, function () {
                    if (this.value || this === document.activeElement) {
                        activateFloatingLabel(this);
                    } else {
                        resetLabel(this);
                    }
                });
            });
        });

        // Máscara e validação para CPF/CNPJ
        cpfCnpj.addEventListener('input', function () {
            this.value = formatarCpfCnpj(this.value);
        });

        // Máscara e busca de endereço para CEP
        cep.addEventListener('input', function () {
            this.value = formatarCep(this.value);
        });

        cep.addEventListener('blur', function () {
            if (this.value.length === 9) { // CEP completo: 00000-000
                buscarEnderecoPorCep(this.value);
            }
        });
    }

    // Função para buscar endereço por CEP
    function buscarEnderecoPorCep(cepValue) {
        // Remover caracteres especiais
        const cepLimpo = cepValue.replace(/\D/g, '');

        // Verificar se o CEP tem o tamanho correto
        if (cepLimpo.length !== 8) {
            return;
        }

        // Mostrar indicador de carregamento
        cidade.disabled = true;
        estado.disabled = true;
        bairro.disabled = true;
        logradouro.disabled = true;

        fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
            .then(response => response.json())
            .then(data => {
                if (!data.erro) {
                    // Preencher os campos com os dados retornados
                    cidade.value = data.localidade;
                    estado.value = data.uf;
                    bairro.value = data.bairro;
                    logradouro.value = data.logradouro;

                    // Ativar as labels flutuantes
                    activateFloatingLabel(cidade);
                    activateFloatingLabel(estado);
                    activateFloatingLabel(bairro);
                    activateFloatingLabel(logradouro);
                } else {
                    mostrarMensagem('CEP não encontrado.', 'erro');
                }
            })
            .catch(error => {
                console.error('Erro ao buscar CEP:', error);
                mostrarMensagem('Erro ao buscar o CEP. Tente novamente.', 'erro');
            })
            .finally(() => {
                // Reabilitar os campos
                cidade.disabled = false;
                estado.disabled = false;
                bairro.disabled = false;
                logradouro.disabled = false;
            });
    }

    // Função para formatar CPF/CNPJ enquanto digita
    function formatarCpfCnpj(valor) {
        // Remover todos os caracteres não numéricos
        valor = valor.replace(/\D/g, '');

        // Verificar se é CPF ou CNPJ com base no tamanho
        if (valor.length <= 11) {
            // Formatar como CPF: 000.000.000-00
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // Formatar como CNPJ: 00.000.000/0000-00
            valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
            valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
            valor = valor.replace(/(\d{4})(\d)/, '$1-$2');

            // Limitar a 18 caracteres (CNPJ formatado)
            if (valor.length > 18) {
                valor = valor.substring(0, 18);
            }
        }

        return valor;
    }

    // Função para formatar CEP enquanto digita
    function formatarCep(valor) {
        // Remover todos os caracteres não numéricos
        valor = valor.replace(/\D/g, '');

        // Formatar como CEP: 00000-000
        valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');

        // Limitar a 9 caracteres (CEP formatado)
        if (valor.length > 9) {
            valor = valor.substring(0, 9);
        }

        return valor;
    }

    // Função para validar o formulário antes de enviar
    function validarFormulario() {
        // Validar campos obrigatórios
        if (!nomeCliente.value.trim()) {
            mostrarMensagem('Por favor, preencha o nome do cliente.', 'erro');
            nomeCliente.focus();
            return false;
        }

        if (!cpfCnpj.value.trim()) {
            mostrarMensagem('Por favor, preencha o CPF ou CNPJ.', 'erro');
            cpfCnpj.focus();
            return false;
        }

        // Verificar se o CPF/CNPJ é válido
        if (!validarCpfCnpj(cpfCnpj.value)) {
            mostrarMensagem('CPF ou CNPJ inválido.', 'erro');
            cpfCnpj.focus();
            return false;
        }

        if (!responsavel.value.trim()) {
            mostrarMensagem('Por favor, preencha o nome do responsável.', 'erro');
            responsavel.focus();
            return false;
        }

        // Validar campos de endereço
        if (!cep.value.trim() || cep.value.length < 9) {
            mostrarMensagem('Por favor, preencha um CEP válido.', 'erro');
            cep.focus();
            return false;
        }

        if (!cidade.value.trim()) {
            mostrarMensagem('Por favor, preencha a cidade.', 'erro');
            cidade.focus();
            return false;
        }

        if (!estado.value.trim()) {
            mostrarMensagem('Por favor, selecione o estado.', 'erro');
            estado.focus();
            return false;
        }

        if (!bairro.value.trim()) {
            mostrarMensagem('Por favor, preencha o bairro.', 'erro');
            bairro.focus();
            return false;
        }

        if (!logradouro.value.trim()) {
            mostrarMensagem('Por favor, preencha o logradouro.', 'erro');
            logradouro.focus();
            return false;
        }

        return true;
    }

    // Função para validar CPF ou CNPJ
    function validarCpfCnpj(documento) {
        // Remover caracteres não numéricos
        const valor = documento.replace(/\D/g, '');

        // Validar com base no tamanho
        if (valor.length === 11) {
            return validarCpf(valor);
        } else if (valor.length === 14) {
            return validarCnpj(valor);
        }

        return false;
    }

    // Função para validar CPF
    function validarCpf(cpf) {
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cpf)) {
            return false;
        }

        // Validar dígitos verificadores
        let soma = 0;
        let resto;

        // Primeiro dígito verificador
        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        // Segundo dígito verificador
        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    // Função para validar CNPJ
    function validarCnpj(cnpj) {
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cnpj)) {
            return false;
        }

        // Validar primeiro dígito verificador
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(0))) return false;

        // Validar segundo dígito verificador
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }

        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(1))) return false;

        return true;
    }

    // Função para enviar o formulário
    function enviarFormulario() {
        // Preparar os dados do cliente
        const dadosCliente = {
            nome: nomeCliente.value.trim(),
            cpfCnpj: cpfCnpj.value.replace(/\D/g, ''), // Remover formatação
            responsavel: responsavel.value.trim(),
            endereco: {
                cep: cep.value.replace(/\D/g, ''),
                cidade: cidade.value.trim(),
                estado: estado.value.trim(),
                bairro: bairro.value.trim(),
                logradouro: logradouro.value.trim(),
                numero: numero.value.trim(),
                complemento: complemento.value.trim()
            }
        };

        console.log('Dados do cliente a serem enviados:', dadosCliente);

        // Simulação de envio bem-sucedido (em produção, substituir por uma chamada fetch real)
        // Desativar o botão durante o envio
        btnCadastrar.disabled = true;
        btnCadastrar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loading-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
            </svg>
            Processando...
        `;

        // Simular uma requisição ao servidor
        setTimeout(() => {
            // Reativar o botão após o processamento
            btnCadastrar.disabled = false;
            btnCadastrar.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Cadastrar Cliente
            `;

            // Mostrar mensagem de sucesso
            mostrarMensagem('Cliente cadastrado com sucesso!', 'sucesso');

            // Limpar o formulário
            limparFormulario();

            /* Em um ambiente real, você faria uma requisição fetch:
            
            fetch('/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosCliente)
            })
            .then(response => response.json())
            .then(data => {
                btnCadastrar.disabled = false;
                btnCadastrar.innerHTML = 'Cadastrar Cliente';
                
                if (data.sucesso) {
                    mostrarMensagem('Cliente cadastrado com sucesso!', 'sucesso');
                    limparFormulario();
                } else {
                    mostrarMensagem('Erro ao cadastrar cliente: ' + data.mensagem, 'erro');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                btnCadastrar.disabled = false;
                btnCadastrar.innerHTML = 'Cadastrar Cliente';
                mostrarMensagem('Erro ao tentar cadastrar o cliente. Tente novamente.', 'erro');
            });
            
            */
        }, 1500);
    }

    // Função para limpar o formulário
    function limparFormulario() {
        // Limpar todos os campos
        nomeCliente.value = '';
        cpfCnpj.value = '';
        responsavel.value = '';
        cep.value = '';
        cidade.value = '';
        estado.value = '';
        bairro.value = '';
        logradouro.value = '';
        numero.value = '';
        complemento.value = '';

        // Resetar todas as labels
        document.querySelectorAll('.form-input').forEach(input => {
            resetLabel(input);
        });
    }

    // Função para ativar a label flutuante
    function activateFloatingLabel(input) {
        const fieldLabel = input.closest('.input-group').querySelector('.field-label');
        if (fieldLabel) {
            fieldLabel.classList.add('active');
            fieldLabel.style.top = '0';
            fieldLabel.style.left = '12px';
            fieldLabel.style.fontSize = '12px';
            fieldLabel.style.color = 'var(--azul-royal)';
            fieldLabel.style.fontWeight = '500';
            fieldLabel.style.backgroundColor = 'var(--branco)';
            fieldLabel.style.zIndex = '3';
        }
    }

    // Função para resetar a label para posição original
    function resetLabel(input) {
        const fieldLabel = input.closest('.input-group').querySelector('.field-label');
        if (fieldLabel) {
            fieldLabel.classList.remove('active');
            fieldLabel.style = '';
        }
    }

    // Substituir ou adicionar a função mostrarMensagem
    function mostrarMensagem(texto, tipo) {
        // Remover mensagens anteriores
        const mensagensAntigas = document.querySelectorAll('.mensagem-modal-overlay');
        mensagensAntigas.forEach(msg => msg.remove());

        // Criar overlay para o modal
        const overlay = document.createElement('div');
        overlay.className = 'mensagem-modal-overlay';

        // Criar o modal de mensagem
        const modalContainer = document.createElement('div');
        modalContainer.className = 'mensagem-modal-container';

        // Criar o cabeçalho do modal com ícone e botão fechar
        const modalHeader = document.createElement('div');
        modalHeader.className = 'mensagem-modal-header';

        // Adicionar ícone apropriado
        const icone = document.createElement('span');
        if (tipo === 'sucesso') {
            icone.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            `;
            modalContainer.classList.add('mensagem-sucesso');
        } else {
            icone.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            `;
            modalContainer.classList.add('mensagem-erro');
        }

        icone.className = 'mensagem-modal-icone';
        modalHeader.appendChild(icone);

        // Adicionar título ao cabeçalho
        const tituloModal = document.createElement('h3');
        tituloModal.className = 'mensagem-modal-titulo';
        tituloModal.textContent = tipo === 'sucesso' ? 'Sucesso!' : 'Atenção!';
        modalHeader.appendChild(tituloModal);

        // Adicionar botão X para fechar
        const btnFecharX = document.createElement('button');
        btnFecharX.className = 'mensagem-modal-fechar-x';
        btnFecharX.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        btnFecharX.addEventListener('click', () => fecharModal(overlay));
        modalHeader.appendChild(btnFecharX);

        // Criar corpo do modal com a mensagem
        const modalBody = document.createElement('div');
        modalBody.className = 'mensagem-modal-body';
        modalBody.textContent = texto;

        // Criar rodapé do modal com botão de fechar
        const modalFooter = document.createElement('div');
        modalFooter.className = 'mensagem-modal-footer';

        const btnFechar = document.createElement('button');
        btnFechar.className = 'mensagem-modal-btn-fechar';
        btnFechar.textContent = 'Fechar';
        btnFechar.addEventListener('click', () => fecharModal(overlay));
        modalFooter.appendChild(btnFechar);

        // Montar o modal
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(modalBody);
        modalContainer.appendChild(modalFooter);
        overlay.appendChild(modalContainer);

        // Adicionar o modal ao DOM
        document.body.appendChild(overlay);

        // Aplicar animação de entrada
        setTimeout(() => {
            modalContainer.classList.add('ativo');
        }, 10);

        // Adicionar evento para fechar o modal ao clicar fora
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                fecharModal(overlay);
            }
        });

        // Fechar automaticamente após 6 segundos para mensagens de sucesso
        if (tipo === 'sucesso') {
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    fecharModal(overlay);
                }
            }, 6000);
        }
    }

    // Função para fechar o modal com animação
    function fecharModal(overlay) {
        const modalContainer = overlay.querySelector('.mensagem-modal-container');
        modalContainer.classList.remove('ativo');
        modalContainer.classList.add('fechando');

        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 300);
    }
});