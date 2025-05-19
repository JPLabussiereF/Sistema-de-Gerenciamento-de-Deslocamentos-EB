// Correção 1: Melhorar a verificação de km inicial e km final
document.addEventListener('DOMContentLoaded', function() {
    // Opções para autocomplete
    const localOptions = ['Casa', 'Almoço', 'Elétrica Bahiana - EB'];
    const clienteOptions = ['Sem cliente'];
    
    // Configuração dos campos de autocomplete
    setupAutocomplete('origem', localOptions);
    setupAutocomplete('destino', localOptions);
    setupAutocomplete('cliente', clienteOptions);
    
    // Definir a data e hora atual como padrão
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('dataHora').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Verificar e atualizar as labels dos campos que já possuem valores
    checkInputsWithValues();
    
    // Botão de enviar formulário
    document.getElementById('btnEnviar').addEventListener('click', function(e) {
        e.preventDefault();
        validarEEnviar();
    });
    
    // Adicionar eventos para atualização automática do campo Cliente
    document.getElementById('destino').addEventListener('change', function() {
        // Se o destino for Casa, Almoço ou EB, preenche automaticamente Cliente como "Sem cliente"
        if (localOptions.some(option => this.value.includes(option))) {
            document.getElementById('cliente').value = 'Sem cliente';
            activateFloatingLabel(document.getElementById('cliente'));
        }
    });
    
    // CORREÇÃO: Remover validação durante digitação do kmFinal
    // A validação agora só ocorrerá no momento do envio do formulário
    
    // Melhoria na validação do kmFinal durante o foco
    document.getElementById('kmFinal').addEventListener('focus', function() {
        const kmInicio = document.getElementById('kmInicio').value;
        if (kmInicio === '') {  // Verifica se está realmente vazio
            mostrarMensagem('erro', 'Sequência Incorreta', 'Por favor, preencha o Km Início primeiro');
            document.getElementById('kmInicio').focus();
        }
    });
    
    // Adicionar eventos específicos para campos numéricos
    // CORREÇÃO: Adicionar eventos para ativar label flutuante em campos numéricos
    document.getElementById('kmInicio').addEventListener('input', function() {
        if (this.value) {
            activateFloatingLabel(this);
        } else {
            resetLabel(this);
        }
    });
    
    document.getElementById('kmFinal').addEventListener('input', function() {
        if (this.value) {
            activateFloatingLabel(this);
        } else {
            resetLabel(this);
        }
    });
    
    // Configurar eventos para os radio buttons de ação
    const radioOptions = document.querySelectorAll('.radio-option');
    radioOptions.forEach(option => {
        const radioInput = option.querySelector('input[type="radio"]');
        
        // Quando um radio é clicado
        radioInput.addEventListener('change', function() {
            // Remover a classe 'selected' de todos os radio options
            radioOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Adicionar a classe 'selected' apenas ao radio option selecionado
            if (this.checked) {
                option.classList.add('selected');
            }
        });
        
        // Quando clica no label inteiro (para melhor UX)
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Dispara o evento change manualmente
            const event = new Event('change');
            radio.dispatchEvent(event);
        });
    });
});

// Função para configurar autocomplete em um campo
function setupAutocomplete(fieldId, options) {
    const inputField = document.getElementById(fieldId);
    const dropdownList = document.getElementById(fieldId + 'Dropdown');
    
    // Função para mostrar as opções do dropdown
    function showDropdown() {
        // Limpar lista anterior
        dropdownList.innerHTML = '';
        
        // Filtrar opções baseadas no texto atual
        const inputValue = inputField.value.toLowerCase();
        const filteredOptions = options.filter(option => 
            option.toLowerCase().includes(inputValue)
        );
        
        // Criar e adicionar itens filtrados ao dropdown
        filteredOptions.forEach(option => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = option;
            
            item.addEventListener('click', function() {
                inputField.value = option;
                dropdownList.style.display = 'none';
                
                // Ativar o efeito da label flutuante
                activateFloatingLabel(inputField);
                
                // Disparar evento de mudança para acionar outros comportamentos
                const event = new Event('change');
                inputField.dispatchEvent(event);
            });
            
            dropdownList.appendChild(item);
        });
        
        // Mostrar dropdown apenas se houver opções
        if (filteredOptions.length > 0) {
            dropdownList.style.display = 'block';
        } else {
            dropdownList.style.display = 'none';
        }
    }
    
    // Mostrar todas as opções ao clicar no campo
    inputField.addEventListener('click', function() {
        showDropdown();
    });
    
    // Filtrar opções ao digitar
    inputField.addEventListener('input', function() {
        showDropdown();
        
        // Caso o valor não esteja na lista e o campo esteja vazio, zerar a label
        if (this.value === '') {
            resetLabel(this);
        } else {
            activateFloatingLabel(this);
        }
    });
    
    // Ocultar dropdown quando clicar fora
    document.addEventListener('click', function(e) {
        if (e.target !== inputField && !dropdownList.contains(e.target)) {
            dropdownList.style.display = 'none';
            
            // Verificar se o valor digitado está na lista de opções
            if (inputField.value && !options.some(opt => opt.toLowerCase() === inputField.value.toLowerCase())) {
                // Se não estiver na lista e for o campo cliente, permitir valores não listados
                if (fieldId !== 'cliente') {
                    inputField.value = '';
                    resetLabel(inputField);
                }
            }
        }
    });
    
    // Adiciona o evento para detectar preenchimento
    ['change', 'blur', 'focus'].forEach(event => {
        inputField.addEventListener(event, function() {
            if (this.value) {
                activateFloatingLabel(this);
            } else {
                resetLabel(this);
            }
        });
    });
}

// Função para validar e enviar o formulário
// Função para validar e enviar o formulário - com mensagens modais
function validarEEnviar() {
    const origem = document.getElementById('origem').value.trim();
    const destino = document.getElementById('destino').value.trim();
    const cliente = document.getElementById('cliente').value.trim();
    const dataHora = document.getElementById('dataHora').value;
    const kmInicio = document.getElementById('kmInicio').value;
    const kmFinal = document.getElementById('kmFinal').value;
    
    // Obter a ação selecionada nos radio buttons
    let acao = '';
    const radioButtons = document.getElementsByName('acao');
    for (const radioButton of radioButtons) {
        if (radioButton.checked) {
            acao = radioButton.value;
            break;
        }
    }
    
    // Validação básica com mensagens de erro em modal
    if (!origem) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo Origem.');
        document.getElementById('origem').focus();
        return;
    }
    
    if (!destino) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo Destino.');
        document.getElementById('destino').focus();
        return;
    }
    
    if (!cliente) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo Cliente.');
        document.getElementById('cliente').focus();
        return;
    }
    
    if (!dataHora) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo Data e Hora.');
        document.getElementById('dataHora').focus();
        return;
    }
    
    if (!kmInicio) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo KM Inicial.');
        document.getElementById('kmInicio').focus();
        return;
    }
    
    if (!kmFinal) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo KM Final.');
        document.getElementById('kmFinal').focus();
        return;
    }
    
    if (!acao) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, selecione uma Ação do Trajeto.');
        return;
    }
    
    // Validação de valores numéricos para km
    const kmInicioNum = parseFloat(kmInicio);
    const kmFinalNum = parseFloat(kmFinal);
    
    if (isNaN(kmInicioNum) || isNaN(kmFinalNum)) {
        mostrarMensagem('erro', 'Dados Inválidos', 'Valores de Km devem ser numéricos.');
        return;
    }
    
    if (kmFinalNum <= kmInicioNum) {
        mostrarMensagem('erro', 'Dados Inválidos', 'O Km Final deve ser maior que o Km Inicial.');
        document.getElementById('kmFinal').focus();
        return;
    }
    
    // Preparação dos dados para envio
    const dadosDeslocamento = {
        origem,
        destino,
        cliente,
        dataHora,
        kmInicio: kmInicioNum,
        kmFinal: kmFinalNum,
        acao
    };

    console.log('Dados do deslocamento:', dadosDeslocamento);

    // Simulação de envio com mensagem de sucesso
    mostrarMensagem('sucesso', 'Registro Concluído', 'Deslocamento registrado com sucesso!');

    // Limpar formulário após envio bem-sucedido
    resetForm();
    
    /* Exemplo de código para enviar para um servidor:
    
    fetch('/api/deslocamentos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosDeslocamento)
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            mostrarMensagem('sucesso', 'Registro Concluído', 'Deslocamento registrado com sucesso!');
            resetForm();
        } else {
            mostrarMensagem('erro', 'Erro no Registro', 'Erro ao registrar deslocamento: ' + data.mensagem);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarMensagem('erro', 'Erro no Sistema', 'Erro ao tentar registrar o deslocamento. Tente novamente mais tarde.');
    });
    
    */
}

// Função para resetar o formulário
function resetForm() {
    // Limpar os campos de texto
    document.getElementById('origem').value = '';
    document.getElementById('destino').value = '';
    document.getElementById('cliente').value = ''; // Limpar o campo cliente
    document.getElementById('kmInicio').value = '';
    document.getElementById('kmFinal').value = '';
    
    // Definir a data e hora atual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('dataHora').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Desmarcar os radio buttons e remover a classe 'selected'
    const radioButtons = document.getElementsByName('acao');
    const radioOptions = document.querySelectorAll('.radio-option');
    
    for (const radioButton of radioButtons) {
        radioButton.checked = false;
    }
    
    radioOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Reseta todos os labels
    resetLabel(document.getElementById('origem'));
    resetLabel(document.getElementById('destino'));
    resetLabel(document.getElementById('cliente')); 
    resetLabel(document.getElementById('kmInicio'));
    resetLabel(document.getElementById('kmFinal'));
    
    // Ativar apenas o label da data e hora, já que este campo sempre terá valor
    activateFloatingLabel(document.getElementById('dataHora'));
}

// Função para ativar a label flutuante
function activateFloatingLabel(input) {
    const fieldLabel = input.closest('.input-group').querySelector('.field-label');
    if (fieldLabel) {
        fieldLabel.classList.add('active');
        // Aplicar estilos via CSS class, mas também definir diretamente para compatibilidade
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
        // Remover estilos inline e deixar o CSS controlar
        fieldLabel.style = '';
    }
}

// Função para verificar os inputs que já possuem valores e ativar suas labels
function checkInputsWithValues() {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        if (input.value) {
            activateFloatingLabel(input);
        }
    });
    
    // Verificar também se algum radio button está marcado inicialmente
    const radioButtons = document.getElementsByName('acao');
    radioButtons.forEach(radio => {
        if (radio.checked) {
            const radioOption = radio.closest('.radio-option');
            if (radioOption) {
                radioOption.classList.add('selected');
            }
        }
    });
}
window.addEventListener('DOMContentLoaded', () => {
    resetForm();
});


// Funções para o modal de mensagem
function mostrarMensagem(tipo, titulo, mensagem) {
    const modal = document.getElementById('mensagemModal');
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

function fecharModal() {
    const modal = document.getElementById('mensagemModal');
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