document.addEventListener('DOMContentLoaded', function() {
    // Armazenar o usuário logado (ID e função)
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
    
    // Verificar se o usuário está logado
    if (!usuarioLogado.id_usuario) {
        // Redirecionar para a página de login se não estiver autenticado
        window.location.href = 'login.html';
        return;
    }
    
    // Armazenar os dados recuperados do servidor
    let clientesData = [];
    let locaisData = [];
    
    // Opções fixas para fallback caso a API falhe
    const localOptionsFixas = ['Casa', 'Almoço', 'Elétrica Bahiana - EB'];
    const clienteOptionsFixas = ['Sem cliente'];
    
    // Buscar dados do servidor
    fetchOpcoesAutocomplete();
    
    // Definir a data e hora atual como padrão
    setDefaultDateTime();
    
    // Verificar e atualizar as labels dos campos que já possuem valores
    checkInputsWithValues();
    
    // Botão de enviar formulário
    document.getElementById('btnEnviar').addEventListener('click', function(e) {
        e.preventDefault();
        validarEEnviar();
    });
    
    // Adicionar eventos para atualização automática do campo Cliente
    document.getElementById('destino').addEventListener('change', function() {
        // Se o destino for Casa, Almoço ou uma das filiais da EB, selecionar a ação correspondente
        if (this.value === 'Casa' || this.value === 'Almoço' || 
            this.value.startsWith('Elétrica Bahiana')) {
            // Encontrar o radio button correspondente
            let acaoValue = this.value;
            
            // Extrair o nome curto da filial para a ação
            if (this.value.startsWith('Elétrica Bahiana')) {
                if (this.value.includes('Lauro')) {
                    acaoValue = 'EB Lauro';
                } else if (this.value.includes('Aracaju')) {
                    acaoValue = 'EB Aracaju';
                } else if (this.value.includes('Salvador')) {
                    acaoValue = 'EB Salvador';
                } else {
                    acaoValue = 'EB';
                }
            }
            
            const radioButtons = document.getElementsByName('acao');
            for (const radioButton of radioButtons) {
                if (radioButton.value === acaoValue) {
                    radioButton.checked = true;
                    // Disparar evento change para atualizar visuais
                    const event = new Event('change');
                    radioButton.dispatchEvent(event);
                    break;
                }
            }
        }
    });
    
    // Melhoria na validação do kmFinal durante o foco
    document.getElementById('kmFinal').addEventListener('focus', function() {
        const kmInicio = document.getElementById('kmInicio').value;
        if (kmInicio === '') {  // Verifica se está realmente vazio
            mostrarMensagem('erro', 'Sequência Incorreta', 'Por favor, preencha o Km Início primeiro');
            document.getElementById('kmInicio').focus();
        }
    });
    
    // Adicionar eventos específicos para campos numéricos
    document.getElementById('kmInicio').addEventListener('input', handleInputChange);
    document.getElementById('kmFinal').addEventListener('input', handleInputChange);
    
    // Configurar eventos para os radio buttons de ação
    configureRadioButtons();
});
    // Adicionar evento para atualização automática do campo Destino
    document.getElementById('cliente').addEventListener('change', function() {
        if (this.value !== 'Sem cliente') {
            // Se o cliente for alterado, o destino se torna igual ao cliente
            document.getElementById('destino').value = this.value;
            activateFloatingLabel(document.getElementById('destino'));
        }
    });
    // Adicionar evento para atualização automática da ação baseada no destino
    document.getElementById('destino').addEventListener('change', function() {
        // Se o destino for Casa, Almoço ou qualquer filial da EB, selecionar a ação correspondente
        if (this.value === 'Casa' || this.value === 'Almoço') {
            // Caso específico para Casa ou Almoço - usa o mesmo valor
            let acaoValue = this.value;
            
            const radioButtons = document.getElementsByName('acao');
            for (const radioButton of radioButtons) {
                if (radioButton.value === acaoValue) {
                    radioButton.checked = true;
                    // Disparar evento change para atualizar visuais
                    const event = new Event('change');
                    radioButton.dispatchEvent(event);
                    break;
                }
            }
        } 
        // Para qualquer filial da Elétrica Bahiana, selecionar o radio button "EB"
        else if (this.value.startsWith('Elétrica Bahiana')) {
            const radioButtons = document.getElementsByName('acao');
            for (const radioButton of radioButtons) {
                if (radioButton.value === 'EB') {
                    radioButton.checked = true;
                    // Disparar evento change para atualizar visuais
                    const event = new Event('change');
                    radioButton.dispatchEvent(event);
                    break;
                }
            }
        }
    });

    // Função para buscar opções de autocomplete da API
    async function fetchOpcoesAutocomplete() {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
        const userId = usuarioLogado.id_usuario;
        
        if (!userId) return;
        
        try {
            // Buscar clientes do usuário logado
            const clientesResponse = await fetch(`http://localhost:3000/api/autocomplete/clientes?userId=${userId}`);
            const clientesResult = await clientesResponse.json();
            
            if (clientesResult.clientes && Array.isArray(clientesResult.clientes)) {
                clientesData = clientesResult.clientes;
                
                // Configurar autocomplete para cliente com dados do servidor
                setupAutocomplete('cliente', [
                    'Sem cliente', 
                    ...clientesData.map(cliente => cliente.nome)
                ]);
            } else {
                // Fallback para opções fixas se a API falhar
                setupAutocomplete('cliente', clienteOptionsFixas);
            }
            
            // Buscar locais (fixos + clientes)
            const locaisResponse = await fetch(`http://localhost:3000/api/autocomplete/locais?userId=${userId}`);
            const locaisResult = await locaisResponse.json();
            
            if (locaisResult.locais && Array.isArray(locaisResult.locais)) {
                locaisData = locaisResult.locais;
                
                // Extrair apenas os nomes para o autocomplete
                const nomesDosLocais = locaisData.map(local => local.nome);
                
                // Configurar autocomplete para origem e destino com dados do servidor
                setupAutocomplete('origem', nomesDosLocais);
                setupAutocomplete('destino', nomesDosLocais);
            } else {
                // Fallback para opções fixas se a API falhar
                setupAutocomplete('origem', localOptionsFixas);
                setupAutocomplete('destino', localOptionsFixas);
            }
        } catch (error) {
            console.error('Erro ao buscar dados para autocomplete:', error);
            
            // Se houver erro na API, usar opções fixas
            setupAutocomplete('cliente', clienteOptionsFixas);
            setupAutocomplete('origem', localOptionsFixas);
            setupAutocomplete('destino', localOptionsFixas);
        }
    }

    // Função atualizada para configurar autocomplete em um campo
    function setupAutocomplete(fieldId, options) {
        const inputField = document.getElementById(fieldId);
        const dropdownList = document.getElementById(fieldId + 'Dropdown');
        
        // Atributo para armazenar as opções válidas
        inputField.dataset.validOptions = JSON.stringify(options);
        
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
                // Criar container para o item (para organizar nome e endereço)
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                
                // Obter o endereço completo (se disponível)
                const enderecoCompleto = getEnderecoCompleto(option);
                
                // Sempre criar um span para o nome (garantindo formatação consistente)
                const nomeSpan = document.createElement('span');
                nomeSpan.className = 'dropdown-item-nome';
                nomeSpan.textContent = option;
                item.appendChild(nomeSpan);
                
                // Se tiver endereço, adicionar essa informação também
                if (enderecoCompleto) {
                    // Criar span para o endereço (texto menor e cinza)
                    const enderecoSpan = document.createElement('span');
                    enderecoSpan.className = 'dropdown-item-endereco';
                    enderecoSpan.textContent = enderecoCompleto;
                    item.appendChild(enderecoSpan);
                    
                    // Adicionar título para mostrar o endereço completo em tooltip também
                    item.title = `${option}: ${enderecoCompleto}`;
                } else if (option === 'Sem cliente') {
                    // Para "Sem cliente", adicionamos um texto explicativo como se fosse um endereço
                    const placeHolderSpan = document.createElement('span');
                    placeHolderSpan.className = 'dropdown-item-endereco';
                    placeHolderSpan.textContent = 'Opte por esta alternativa caso a realização da ação \'Visita\' não ocorra.';
                    placeHolderSpan.style.opacity = '0.7'; // Tornar visível mas sutil
                    item.appendChild(placeHolderSpan);
                }
                
                item.addEventListener('click', function() {
                    inputField.value = option;
                    dropdownList.style.display = 'none';
                    
                    // Ativar o efeito da label flutuante
                    activateFloatingLabel(inputField);
                    
                    // Marcar explicitamente como uma seleção válida
                    inputField.dataset.validSelection = 'true';
                    
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
            
            // Importante: Marcar como não sendo uma seleção válida ainda
            // Isso é crucial - será marcado como válido apenas quando clicar em um item
            delete this.dataset.validSelection;
        });
        
        // Ocultar dropdown quando clicar fora
        document.addEventListener('click', function(e) {
            if (e.target !== inputField && !dropdownList.contains(e.target)) {
                dropdownList.style.display = 'none';
                
                // Verificar se o valor digitado está na lista de opções ou se uma seleção válida foi feita
                const validOptions = JSON.parse(inputField.dataset.validOptions || '[]');
                const isExactMatch = validOptions.some(opt => 
                    opt.toLowerCase() === inputField.value.toLowerCase()
                );
                
                // FIX: Se tiver uma seleção válida do dropdown, não limpe o campo
                if (inputField.value && !isExactMatch && inputField.dataset.validSelection !== 'true') {
                    // Se não estiver na lista e não for uma seleção válida
                    inputField.value = '';
                    resetLabel(inputField);
                    
                    if (inputField.value !== '') {
                        mostrarMensagem('erro', 'Valor Inválido', 'Por favor, selecione uma opção da lista.');
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
        
    // Ocultar dropdown quando clicar fora
    document.addEventListener('click', function(e) {
        if (e.target !== inputField && !dropdownList.contains(e.target)) {
            dropdownList.style.display = 'none';
            
            // Verificar se o valor digitado está na lista de opções ou se uma seleção válida foi feita
            const validOptions = JSON.parse(inputField.dataset.validOptions || '[]');
            const isExactMatch = validOptions.some(opt => 
                opt.toLowerCase() === inputField.value.toLowerCase()
            );
            
            // FIX: Se tiver uma seleção válida do dropdown, não limpe o campo
            if (inputField.value && !isExactMatch && inputField.dataset.validSelection !== 'true') {
                // Se não estiver na lista e não for uma seleção válida
                inputField.value = '';
                resetLabel(inputField);
                
                if (inputField.value !== '') {
                    mostrarMensagem('erro', 'Valor Inválido', 'Por favor, selecione uma opção da lista.');
                }
            }
        }
    });
    }

// Função para obter o endereço completo de um cliente ou local
function getEnderecoCompleto(nome) {
    // Verificar nos clientes
    const clienteEncontrado = clientesData.find(cliente => cliente.nome === nome);
    if (clienteEncontrado) {
        return clienteEncontrado.endereco_completo;
    }
    
    // Verificar nos locais
    const localEncontrado = locaisData.find(local => local.nome === nome);
    if (localEncontrado) {
        return localEncontrado.endereco_completo;
    }
    
    return null;
}

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
    
    // Validar que os valores dos campos estão na lista de opções válidas
    const origemOptions = JSON.parse(document.getElementById('origem').dataset.validOptions || '[]');
    const destinoOptions = JSON.parse(document.getElementById('destino').dataset.validOptions || '[]');
    const clienteOptions = JSON.parse(document.getElementById('cliente').dataset.validOptions || '[]');
    
    // Validação básica com mensagens de erro em modal
    if (!origem) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo Origem.');
        document.getElementById('origem').focus();
        return;
    }
    
    if (!origemOptions.some(opt => opt.toLowerCase() === origem.toLowerCase())) {
        mostrarMensagem('erro', 'Origem Inválida', 'Por favor, selecione uma origem válida da lista.');
        document.getElementById('origem').focus();
        return;
    }
    
    if (!destino) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo Destino.');
        document.getElementById('destino').focus();
        return;
    }
    
    if (!destinoOptions.some(opt => opt.toLowerCase() === destino.toLowerCase())) {
        mostrarMensagem('erro', 'Destino Inválido', 'Por favor, selecione um destino válido da lista.');
        document.getElementById('destino').focus();
        return;
    }
    
    if (!cliente) {
        mostrarMensagem('erro', 'Campo Obrigatório', 'Por favor, preencha o campo Cliente.');
        document.getElementById('cliente').focus();
        return;
    }
    
    if (!clienteOptions.some(opt => opt.toLowerCase() === cliente.toLowerCase())) {
        mostrarMensagem('erro', 'Cliente Inválido', 'Por favor, selecione um cliente válido da lista.');
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
    // Validação: Se Origem e Destino forem iguais
    if (origem === destino) {
        mostrarMensagem('erro', 'Dados Inconsistentes', 'Origem e Destino não podem ser iguais.');
        document.getElementById('destino').focus();
        return;
    }

    // Validação: Cliente vs. Ação do Trajeto
    if (cliente !== 'Sem cliente' && acao !== 'Visita') {   
        mostrarMensagem('erro', 'Dados Inconsistentes', 'A ação do trajeto deve ser "Visita", pois você estará indo até um cliente.');
        return;
    }

    // Validação: Destino vs. Cliente
    if ((destino === 'Casa' || destino === 'Almoço' || destino.startsWith('Elétrica Bahiana')) && 
        cliente !== 'Sem cliente') {
        mostrarMensagem('erro', 'Dados Inconsistentes', 'Quando o Destino for Casa, Almoço ou Elétrica Bahiana, o Cliente deve ser "Sem cliente".');
        document.getElementById('cliente').focus();
        return;
    }
    // Validar a relação entre cliente e destino
    if (cliente !== 'Sem cliente' && 
        destino !== cliente && 
        destino !== 'Casa' && 
        destino !== 'Almoço' && 
        !destino.startsWith('Elétrica Bahiana')) {
        mostrarMensagem('erro', 'Dados Inconsistentes', 'O destino deve ser igual ao cliente selecionado, exceto quando for Casa, Almoço ou Elétrica Bahiana.');
        document.getElementById('destino').focus();
        return;
    }

    // Validar a relação entre destino e ação
    if ((destino === 'Casa' && acao !== 'Casa') || 
        (destino === 'Almoço' && acao !== 'Almoço') || 
        (destino.startsWith('Elétrica Bahiana') && acao !== 'EB')) {
        mostrarMensagem('erro', 'Dados Inconsistentes', 'Quando o destino for Casa, Almoço ou Elétrica Bahiana, a ação do trajeto deve corresponder ao destino.');
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
    
    // Recuperar IDs dos objetos selecionados
    const clienteId = getIdPorNome(cliente, 'cliente');
    
    // Encontrar cliente/local associado à origem e destino
    const origemId = getIdPorNome(origem, 'local');
    const destinoId = getIdPorNome(destino, 'local');
    
    // Preparação dos dados para envio
    const dadosDeslocamento = {
        origem_id: origemId,
        origem_nome: origem,
        destino_id: destinoId, 
        destino_nome: destino,
        cliente_id: clienteId,
        cliente_nome: cliente,
        dataHora,
        kmInicio: kmInicioNum,
        kmFinal: kmFinalNum,
        acao,
        usuario_id: getUserId()
    };

    console.log('Dados do deslocamento:', dadosDeslocamento);

    // Iniciar o indicador de carregamento
    document.getElementById('btnEnviar').disabled = true;
    document.getElementById('btnEnviar').textContent = 'Enviando...';

    // Enviar dados para o servidor
    fetch('http://localhost:3000/api/deslocamentos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': getUserId()
        },
        body: JSON.stringify(dadosDeslocamento)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor');
        }
        return response.json();
    })
    .then(data => {
        if (data.sucesso) {
            mostrarMensagem('sucesso', 'Registro Concluído', 'Deslocamento registrado com sucesso!');
            resetForm();
        } else {
            mostrarMensagem('erro', 'Erro no Sistema', data.mensagem || 'Erro ao tentar registrar o deslocamento.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        mostrarMensagem('erro', 'Erro no Sistema', 'Erro ao tentar registrar o deslocamento. Tente novamente mais tarde.');
    })
    .finally(() => {
        // Restaurar o botão de envio
        document.getElementById('btnEnviar').disabled = false;
        document.getElementById('btnEnviar').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Enviar Formulário
        `;
    });
}

// Função para obter o ID de um cliente ou local pelo nome
function getIdPorNome(nome, tipo) {
    if (tipo === 'cliente') {
        const clienteEncontrado = clientesData.find(c => c.nome === nome);
        return clienteEncontrado ? clienteEncontrado.id_cliente : null;
    } else if (tipo === 'local') {
        const localEncontrado = locaisData.find(l => l.nome === nome);
        return localEncontrado ? localEncontrado.id || localEncontrado.id_cliente : null;
    }
    return null;
}

// Função para obter o ID do usuário logado
function getUserId() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
    return usuarioLogado.id_usuario;
}

// Função para definir data e hora padrão
function setDefaultDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('dataHora').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    activateFloatingLabel(document.getElementById('dataHora'));
}

// Handler genérico para eventos de input
function handleInputChange() {
    if (this.value) {
        activateFloatingLabel(this);
    } else {
        resetLabel(this);
    }
}

// Configurar eventos para radio buttons
function configureRadioButtons() {
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
}

// Função para resetar o formulário
function resetForm() {
    // Limpar os campos de texto
    document.getElementById('origem').value = '';
    document.getElementById('destino').value = '';
    document.getElementById('cliente').value = ''; // Limpar o campo cliente
    document.getElementById('kmInicio').value = '';
    document.getElementById('kmFinal').value = '';
    
    // Atualizar a data e hora atual
    setDefaultDateTime();
    
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