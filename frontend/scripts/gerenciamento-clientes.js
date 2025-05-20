document.addEventListener('DOMContentLoaded', function() {
    // Armazenar o usuário logado (ID e função)
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado')) || {};
    
    // Verificar se o usuário está logado
    if (!usuarioLogado.id_usuario) {
        // Redirecionar para a página de login se não estiver autenticado
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar se o usuário é administrador
    if (usuarioLogado.funcao !== 'adm') {
        // Redirecionar ou mostrar mensagem de erro se não tiver permissão
        mostrarMensagem('erro', 'Acesso Negado', 'Você não tem permissão para acessar esta página.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }
    
    // Variáveis globais
    let clientes = [];
    let vendedores = [];
    let paginaAtual = 1;
    const itensPorPagina = 10;
    let clienteEmEdicao = null;
    
    // Elementos do DOM
    const searchInput = document.getElementById('searchInput');
    const clientsTableBody = document.getElementById('clientsTableBody');
    const paginationContainer = document.getElementById('paginationContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const editModal = document.getElementById('editModal');
    const vendedorSelect = document.getElementById('vendedorSelect');
    const modalClienteNome = document.getElementById('modalClienteNome');
    const modalClienteCodigo = document.getElementById('modalClienteCodigo');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    // Inicializar a página
    init();
    // Função para teste de conexão com o servidor
    async function testarConexaoServidor() {
        try {
            const response = await fetch('http://localhost:3000/api/clientes', {
                method: 'GET',
                headers: {
                    'Authorization': usuarioLogado.id_usuario
                }
            });
            
            console.log('Teste de conexão:', response.status, response.statusText);
            const contentType = response.headers.get('content-type');
            console.log('Tipo de conteúdo:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('Resposta do servidor:', data);
                return true;
            } else {
                console.error('Resposta não-JSON recebida');
                return false;
            }
        } catch (error) {
            console.error('Erro ao testar conexão:', error);
            return false;
        }
    }
    // Função de inicialização
    function init() {
        // Testar a conexão com o servidor antes de tudo
        testarConexaoServidor().then(conexaoOk => {
            if (!conexaoOk) {
                mostrarMensagem('erro', 'Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando corretamente.');
            }
        });
        // Carregar dados iniciais
        carregarClientes();
        carregarVendedores();
        
        // Configurar eventos
        searchInput.addEventListener('input', filtrarClientes);
        saveEditBtn.addEventListener('click', salvarAlteracaoVendedor);
        cancelEditBtn.addEventListener('click', fecharModal);
        closeModalBtn.addEventListener('click', fecharModal);
        // Adicionar evento para importação de CSV
        document.getElementById('importCsv').addEventListener('change', handleCsvImport);
        document.getElementById('importDoneBtn').addEventListener('click', fecharModalImportacao);
        
        // Configurar evento para fechar o modal ao clicar fora
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) {
                fecharModal();
            }
        });
    }
    
    // Função para carregar clientes do servidor
    async function carregarClientes() {
        mostrarLoading(true);
        
        try {
            const response = await fetch('http://localhost:3000/api/clientes', {
                method: 'GET',
                headers: {
                    'Authorization': usuarioLogado.id_usuario
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao carregar clientes');
            }
            
            const data = await response.json();
            
            if (data.sucesso === false) {
                throw new Error(data.mensagem || 'Erro ao carregar clientes');
            }
            
            clientes = data.clientes || [];
            renderizarClientes(clientes);
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarMensagem('erro', 'Erro no Sistema', 'Não foi possível carregar a lista de clientes. Tente novamente mais tarde.');
            clientsTableBody.innerHTML = '<tr><td colspan="4" class="loading-data">Erro ao carregar dados.</td></tr>';
        } finally {
            mostrarLoading(false);
        }
    }
    
    // Função para carregar vendedores do servidor
    async function carregarVendedores() {
        try {
            const response = await fetch('http://localhost:3000/api/clientes/vendedores', {
                method: 'GET',
                headers: {
                    'Authorization': usuarioLogado.id_usuario
                }
            });
            
            if (!response.ok) {
                // Tentar extrair mensagem de erro da resposta
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.mensagem || `Erro ${response.status}: ${response.statusText}`);
                } catch (jsonError) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            if (data.sucesso === false) {
                throw new Error(data.mensagem || 'Erro ao carregar vendedores');
            }
            
            vendedores = data.vendedores || [];
            console.log('Vendedores carregados:', vendedores.length);
            
        } catch (error) {
            console.error('Erro ao carregar vendedores:', error);
            mostrarMensagem('erro', 'Erro no Sistema', `Não foi possível carregar a lista de vendedores: ${error.message}`);
        }
    }
    
    // Função para renderizar os clientes na tabela com paginação
    function renderizarClientes(clientesArr) {
        // Limpar a tabela
        clientsTableBody.innerHTML = '';
        
        // Se não houver clientes, mostrar mensagem
        if (!clientesArr || clientesArr.length === 0) {
            clientsTableBody.innerHTML = '<tr><td colspan="4" class="loading-data">Nenhum cliente encontrado.</td></tr>';
            paginationContainer.innerHTML = '';
            return;
        }
        
        // Calcular total de páginas
        const totalPaginas = Math.ceil(clientesArr.length / itensPorPagina);
        
        // Garantir que a página atual está dentro dos limites
        if (paginaAtual > totalPaginas) {
            paginaAtual = totalPaginas;
        }
        
        // Calcular os índices de início e fim para a página atual
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = Math.min(inicio + itensPorPagina, clientesArr.length);
        
        // Obter os clientes da página atual
        const clientesPaginados = clientesArr.slice(inicio, fim);
        
        // Renderizar cada cliente na tabela
        clientesPaginados.forEach((cliente) => {
            const tr = document.createElement('tr');
            
            const tdCodigo = document.createElement('td');
            tdCodigo.textContent = cliente.cod_cliente || '-';
            tr.appendChild(tdCodigo);
            
            const tdNome = document.createElement('td');
            tdNome.textContent = cliente.nome_cliente;
            tr.appendChild(tdNome);
            
            const tdVendedor = document.createElement('td');
            tdVendedor.textContent = cliente.vendedor_nome || 'Não atribuído';
            tr.appendChild(tdVendedor);
            
            const tdEdit = document.createElement('td');
            tdEdit.className = 'action-column';
            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            `;
            editButton.addEventListener('click', () => abrirModalEdicao(cliente));
            tdEdit.appendChild(editButton);
            tr.appendChild(tdEdit);
            
            clientsTableBody.appendChild(tr);
        });
        
        // Renderizar a paginação
        renderizarPaginacao(totalPaginas);
    }
    
    // Função para renderizar a paginação
    function renderizarPaginacao(totalPaginas) {
        paginationContainer.innerHTML = '';
        
        // Se houver apenas 1 página, não exibir a paginação
        if (totalPaginas <= 1) {
            return;
        }
        
        // Botão Anterior
        const btnAnterior = document.createElement('button');
        btnAnterior.className = `page-button ${paginaAtual === 1 ? 'disabled' : ''}`;
        btnAnterior.textContent = 'Anterior';
        btnAnterior.disabled = paginaAtual === 1;
        btnAnterior.addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarClientes(clientes);
            }
        });
        paginationContainer.appendChild(btnAnterior);
        
        // Determinar quais páginas mostrar
        let startPage = Math.max(1, paginaAtual - 2);
        let endPage = Math.min(totalPaginas, startPage + 4);
        
        // Ajustar startPage se necessário para mostrar 5 botões
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Botões de páginas
        for (let i = startPage; i <= endPage; i++) {
            const btnPage = document.createElement('button');
            btnPage.className = `page-button ${i === paginaAtual ? 'active' : ''}`;
            btnPage.textContent = i.toString();
            btnPage.addEventListener('click', () => {
                paginaAtual = i;
                renderizarClientes(clientes);
            });
            paginationContainer.appendChild(btnPage);
        }
        
        // Botão Próxima
        const btnProxima = document.createElement('button');
        btnProxima.className = `page-button ${paginaAtual === totalPaginas ? 'disabled' : ''}`;
        btnProxima.textContent = 'Próxima';
        btnProxima.disabled = paginaAtual === totalPaginas;
        btnProxima.addEventListener('click', () => {
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarClientes(clientes);
            }
        });
        paginationContainer.appendChild(btnProxima);
    }
    
    // Função para filtrar clientes com base no texto da pesquisa
    function filtrarClientes() {
        const textoBusca = searchInput.value.toLowerCase().trim();
        
        // Se o texto de busca estiver vazio, mostrar todos os clientes
        if (!textoBusca) {
            renderizarClientes(clientes);
            return;
        }
        
        // Filtrar clientes com base no texto de busca
        const clientesFiltrados = clientes.filter(cliente => {
            const codigoCliente = cliente.cod_cliente ? cliente.cod_cliente.toString().toLowerCase() : '';
            const nomeCliente = cliente.nome_cliente.toLowerCase();
            const nomeVendedor = cliente.vendedor_nome ? cliente.vendedor_nome.toLowerCase() : '';
            
            return (
                codigoCliente.includes(textoBusca) ||
                nomeCliente.includes(textoBusca) ||
                nomeVendedor.includes(textoBusca)
            );
        });
        
        // Resetar para a primeira página e renderizar os resultados
        paginaAtual = 1;
        renderizarClientes(clientesFiltrados);
    }
    
    // Função para abrir o modal de edição
    function abrirModalEdicao(cliente) {
        // Armazenar o cliente em edição
        clienteEmEdicao = cliente;
        
        // Preencher dados do cliente no modal
        modalClienteNome.textContent = cliente.nome_cliente;
        modalClienteCodigo.textContent = cliente.cod_cliente || '-';
        
        // Limpar e preencher o select de vendedores
        vendedorSelect.innerHTML = '';
        
        // Adicionar opção "Sem vendedor"
        const optionSemVendedor = document.createElement('option');
        optionSemVendedor.value = '';
        optionSemVendedor.textContent = 'Sem vendedor atribuído';
        vendedorSelect.appendChild(optionSemVendedor);
        
        // Adicionar os vendedores disponíveis
        vendedores.forEach(vendedor => {
            const option = document.createElement('option');
            option.value = vendedor.id_usuario;
            option.textContent = vendedor.nome;
            // Selecionar o vendedor atual do cliente, se houver
            if (cliente.id_usuario === vendedor.id_usuario) {
                option.selected = true;
            }
            vendedorSelect.appendChild(option);
        });
        
        // Exibir o modal
        editModal.classList.add('active');
        setTimeout(() => {
            const modalContainer = editModal.querySelector('.modal-container');
            modalContainer.style.opacity = '1';
            modalContainer.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // Função para fechar o modal
    function fecharModal() {
        const modalContainer = editModal.querySelector('.modal-container');
        modalContainer.style.opacity = '0';
        modalContainer.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            editModal.classList.remove('active');
            clienteEmEdicao = null;
        }, 300);
    }
    
    // Função para salvar a alteração do vendedor
    async function salvarAlteracaoVendedor() {
        if (!clienteEmEdicao) {
            mostrarMensagem('erro', 'Erro', 'Nenhum cliente selecionado para edição.');
            return;
        }
        
        // Verificar se temos vendedores carregados
        if (!vendedores || vendedores.length === 0) {
            try {
                // Tentar carregar os vendedores novamente se não estiverem disponíveis
                await carregarVendedores();
                
                if (!vendedores || vendedores.length === 0) {
                    mostrarMensagem('erro', 'Erro', 'Não foi possível carregar a lista de vendedores. Tente novamente.');
                    return;
                }
            } catch (error) {
                mostrarMensagem('erro', 'Erro', 'Não foi possível carregar a lista de vendedores. Tente novamente.');
                return;
            }
        }
        
        const idVendedor = vendedorSelect.value;
        const idCliente = clienteEmEdicao.id_cliente;
        
        try {
            mostrarLoading(true);
            
            const response = await fetch(`http://localhost:3000/api/clientes/${idCliente}/vendedor`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': usuarioLogado.id_usuario
                },
                body: JSON.stringify({
                    id_usuario: idVendedor || null
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao atualizar vendedor');
            }
            
            const data = await response.json();
            
            if (data.sucesso === false) {
                throw new Error(data.mensagem || 'Erro ao atualizar vendedor');
            }
            
            // Atualizar dados do cliente na lista local
            const clienteIndex = clientes.findIndex(c => c.id_cliente === clienteEmEdicao.id_cliente);
            if (clienteIndex !== -1) {
                // Atualizar o ID do vendedor
                clientes[clienteIndex].id_usuario = idVendedor || null;
                
                // Atualizar o nome do vendedor
                if (idVendedor) {
                    const vendedor = vendedores.find(v => v.id_usuario === idVendedor);
                    clientes[clienteIndex].vendedor_nome = vendedor ? vendedor.nome : 'Não atribuído';
                } else {
                    clientes[clienteIndex].vendedor_nome = 'Não atribuído';
                }
            }
            
            // Fechar o modal
            fecharModal();
            
            // Atualizar a tabela
            renderizarClientes(clientes);
            
            // Mostrar mensagem de sucesso
            mostrarMensagem('sucesso', 'Alteração Concluída', 'Vendedor alterado com sucesso!');
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarMensagem('erro', 'Erro no Sistema', 'Não foi possível atualizar o vendedor. Tente novamente mais tarde.');
        } finally {
            mostrarLoading(false);
        }
    }
    
    // Função para mostrar/ocultar o indicador de carregamento
    function mostrarLoading(exibir) {
        if (exibir) {
            loadingIndicator.style.display = 'flex';
        } else {
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Função para mostrar mensagem modal
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
    
    // Função para fechar modal de mensagem
    window.fecharMensagemModal = function() {
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
    };

    // Função para processar a importação do arquivo CSV
    async function handleCsvImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            mostrarMensagem('erro', 'Formato Inválido', 'Por favor, selecione um arquivo CSV válido.');
            event.target.value = '';
            return;
        }
        
        // Mostrar modal de progresso
        mostrarModalImportacao();
        
        try {
            // Ler o arquivo CSV
            const csvData = await lerArquivoCSV(file);
            
            // Processar os dados do CSV
            const todoClientes = processarDadosCSV(csvData);
            
            // Dividir em lotes de 1000 clientes
            const tamanhoDeLote = 1000;
            const totalLotes = Math.ceil(todoClientes.length / tamanhoDeLote);
            let importadosTotal = 0;
            let ignoradosTotal = 0;
            let errosTotal = [];
            
            atualizarStatusImportacao(`Processando ${todoClientes.length} clientes em ${totalLotes} lotes...`, 'processando', 50);
            
            // Importar os clientes em lotes
            for (let i = 0; i < totalLotes; i++) {
                const inicio = i * tamanhoDeLote;
                const fim = Math.min((i + 1) * tamanhoDeLote, todoClientes.length);
                const loteDEClientes = todoClientes.slice(inicio, fim);
                
                atualizarStatusImportacao(`Importando lote ${i+1} de ${totalLotes}...`, 'processando', 
                                        50 + Math.floor((i / totalLotes) * 50));
                
                try {
                    const resultado = await importarClientes(loteDEClientes);
                    
                    if (resultado.inseridos) importadosTotal += resultado.inseridos;
                    if (resultado.ignorados) ignoradosTotal += resultado.ignorados;
                    if (resultado.erros && resultado.erros.length) errosTotal = errosTotal.concat(resultado.erros);
                    
                } catch (error) {
                    console.error(`Erro ao processar lote ${i+1}:`, error);
                    errosTotal.push(`Erro no lote ${i+1}: ${error.message}`);
                }
            }
            
            // Mostrar resultado final
            atualizarStatusImportacao('Importação concluída com sucesso!', 'sucesso', 100);
            
            // Exibir o resumo da importação
            mostrarResumoImportacao({
                inseridos: importadosTotal,
                ignorados: ignoradosTotal,
                erros: errosTotal
            });
            
            // Recarregar a lista de clientes
            await carregarClientes();
            
        } catch (error) {
            console.error('Erro na importação:', error);
            atualizarStatusImportacao('Erro ao processar o arquivo: ' + error.message, 'erro');
        } finally {
            // Limpar o input do arquivo para permitir selecionar o mesmo arquivo novamente
            event.target.value = '';
        }
    }

    // Função para ler o arquivo CSV
    function lerArquivoCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                resolve(event.target.result);
            };
            
            reader.onerror = function() {
                reject(new Error('Erro ao ler o arquivo'));
            };
            
            reader.readAsText(file);
        });
    }

    // Função para processar os dados do CSV
    function processarDadosCSV(csvData) {
        // Atualizando o status
        atualizarStatusImportacao('Processando dados do arquivo...', 'processando', 25);
        
        // Dividir linhas do CSV
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        const clientes = [];
        
        // Processar cada linha
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Função para processar linha e extrair os valores considerando strings com vírgulas
            const valores = parseCsvLine(line);
            
            // Se não tiver pelo menos o nome do cliente, ignorar
            if (valores.length < 2) continue;
            
            const cliente = {
                cod_cliente: valores[0]?.trim() || null,
                nome_cliente: (valores[1]?.trim() || '').replace(/"/g, ''),
                cnpj: (valores[2]?.trim() || '').replace(/"/g, '').replace(/[^\d]/g, ''), // Remover caracteres não numéricos
                logradouro: (valores[3]?.trim() || '').replace(/"/g, ''),
                bairro: (valores[4]?.trim() || '').replace(/"/g, ''),
                cep: (valores[5]?.trim() || '').replace(/"/g, '').replace(/[^\d]/g, ''), // Remover caracteres não numéricos
                cidade: (valores[6]?.trim() || '').replace(/"/g, ''),
                estado: (valores[7]?.trim() || '').replace(/"/g, '')
            };
            
            // Só adicionar se tiver pelo menos o nome do cliente
            if (cliente.nome_cliente) {
                clientes.push(cliente);
            }
            
            // Atualizar a barra de progresso
            const progresso = 25 + Math.floor((i / lines.length) * 25);
            if (i % 1000 === 0) {
                atualizarStatusImportacao(`Processando linha ${i + 1} de ${lines.length}...`, 'processando', progresso);
            }
        }
        
        return clientes;
    }

    // Função para processar linha de CSV considerando valores entre aspas
    function parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Adicionar o último valor
        result.push(current);
        
        return result;
    }

    // Função para importar clientes para o banco de dados
async function importarClientes(clientes) {
    atualizarStatusImportacao('Verificando dados no servidor...', 'processando', 50);
    
    try {
        // Adicione logs para debug
        console.log('Enviando dados para o servidor:', JSON.stringify({ clientes }).slice(0, 200) + '...');
        
        const response = await fetch('http://localhost:3000/api/clientes/importar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': usuarioLogado.id_usuario
            },
            body: JSON.stringify({ clientes })
        });
        
            // Verificar o tipo de conteúdo da resposta
            const contentType = response.headers.get('content-type');
            console.log('Tipo de conteúdo da resposta:', contentType);
            
            if (!response.ok) {
                // Verificar o conteúdo da resposta para melhor diagnóstico
                const responseText = await response.text();
                console.error('Resposta de erro completa:', responseText);
                
                // Tentar analisar como JSON se possível
                let errorMessage = 'Erro ao importar clientes';
                try {
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.mensagem || errorMessage;
                    } else {
                        errorMessage = `Erro ${response.status}: Resposta não-JSON recebida`;
                    }
                } catch (e) {
                    errorMessage = `Erro ${response.status}: ${responseText.substring(0, 100)}...`;
                }
                
                throw new Error(errorMessage);
            }
            
            // Verificar se a resposta é JSON antes de tentar analisar
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('O servidor não retornou uma resposta JSON válida');
            }
            
            const data = await response.json();
            
            // Atualizar o status para concluído
            atualizarStatusImportacao('Importação concluída com sucesso!', 'sucesso', 100);
            
            // Exibir o resumo da importação
            mostrarResumoImportacao(data);
            
            return data;
            
        } catch (error) {
            console.error('Erro na importação:', error);
            throw error;
        }
    }

    // Função para mostrar o modal de importação
    function mostrarModalImportacao() {
        const modal = document.getElementById('importProgressModal');
        const progressBar = document.getElementById('importProgressBar');
        const importStatus = document.getElementById('importStatus');
        const importSummary = document.getElementById('importSummary');
        const importDoneBtn = document.getElementById('importDoneBtn');
        
        // Resetar elementos
        progressBar.style.width = '0';
        importStatus.textContent = 'Processando arquivo...';
        importStatus.style.color = 'var(--texto-primario)';
        importSummary.style.display = 'none';
        importSummary.innerHTML = '';
        importDoneBtn.style.display = 'none';
        
        // Mostrar o modal
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    // Função para atualizar o status da importação
    function atualizarStatusImportacao(mensagem, tipo, progresso) {
        const progressBar = document.getElementById('importProgressBar');
        const importStatus = document.getElementById('importStatus');
        
        importStatus.textContent = mensagem;
        
        if (progresso !== undefined) {
            progressBar.style.width = `${progresso}%`;
        }
        
        if (tipo === 'erro') {
            importStatus.style.color = 'var(--vermelho-erro)';
            document.getElementById('importDoneBtn').style.display = 'inline-block';
        } else if (tipo === 'sucesso') {
            importStatus.style.color = 'var(--verde-sucesso)';
        }
    }

    // Função para mostrar o resumo da importação
    function mostrarResumoImportacao(data) {
        const importSummary = document.getElementById('importSummary');
        const importDoneBtn = document.getElementById('importDoneBtn');
        
        // Criar resumo
        let resumoHTML = '';
        
        if (data.inseridos && data.inseridos > 0) {
            resumoHTML += `<p><strong>Clientes inseridos:</strong> ${data.inseridos}</p>`;
        }
        
        if (data.ignorados && data.ignorados > 0) {
            resumoHTML += `<p><strong>Clientes ignorados (já existentes):</strong> ${data.ignorados}</p>`;
        }
        
        if (data.erros && data.erros.length > 0) {
            resumoHTML += `<p><strong>Erros encontrados:</strong></p><ul>`;
            
            data.erros.forEach(erro => {
                resumoHTML += `<li>${erro}</li>`;
            });
            
            resumoHTML += `</ul>`;
        }
        
        // Exibir o resumo
        importSummary.innerHTML = resumoHTML;
        importSummary.style.display = 'block';
        importDoneBtn.style.display = 'inline-block';
    }

    // Função para fechar o modal de importação
    function fecharModalImportacao() {
        const modal = document.getElementById('importProgressModal');
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
});