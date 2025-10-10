document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const leftPage = document.getElementById('left-page');
    const rightPageContainer = document.getElementById('right-page-container');
    let paginaTopo, paginaFundo;
    let prevPageBtn; // NOVO: Referência para o botão de voltar

    // --- ESTADO DO JOGO ---
    let estadoAtual = { passagemId: 'prologo', subPagina: 0 };
    let isAnimating = false;
    const historicoDeEstados = []; // NOVO: Array para guardar o histórico de navegação

    /**
     * NOVO: Atualiza o estado visual dos botões de navegação.
     */
    function atualizarEstadoBotoes() {
        if (!prevPageBtn) {
            prevPageBtn = document.getElementById('prev-page-btn');
        }
        prevPageBtn.disabled = historicoDeEstados.length === 0;
    }

    /**
     * Renderiza o conteúdo de um estado na página da direita.
     */
    function renderizarPaginaDireita(pageElement, estado) {
        const passagem = historia[estado.passagemId];
        if (!passagem) return;

        pageElement.innerHTML = `
            <div class="face frente">
                <div class="content"></div>
                <div class="choices"></div>
                <div class="page-flipper"><button class="next-page-btn hidden">Virar página &rarr;</button></div>
            </div>
            <div class="face verso"></div>`;

        const contentDiv = pageElement.querySelector('.content');
        const choicesDiv = pageElement.querySelector('.choices');
        const btnNext = pageElement.querySelector('.next-page-btn');
        
        const paginas = passagem.texto.split('---');
        const textoDaSubPagina = paginas[estado.subPagina].trim().replace(/\n/g, '<br>');
        contentDiv.innerHTML = `<p>${textoDaSubPagina}</p>`;
        
        if (estado.subPagina < paginas.length - 1) {
            btnNext.classList.remove('hidden');
            choicesDiv.classList.add('hidden');
        } else {
            btnNext.classList.add('hidden');
            choicesDiv.classList.remove('hidden');
            
            choicesDiv.innerHTML = '';
            if (!passagem.opcoes || passagem.opcoes.length === 0) {
                choicesDiv.innerHTML = '<p><i>Fim desta parte da história...</i></p>';
                choicesDiv.style.borderTop = 'none';
            } else {
                choicesDiv.style.borderTop = '1px solid rgba(61, 43, 31, 0.1)';
                passagem.opcoes.forEach(opcao => {
                    const button = document.createElement('button');
                    button.textContent = opcao.texto;
                    button.onclick = () => fazerEscolha(opcao.destino);
                    choicesDiv.appendChild(button);
                });
            }
        }
    }
    
    /**
     * Prepara a transição, configurando o conteúdo das páginas "ocultas".
     */
    function prepararTransicao(proximoEstado) {
        const faceVerso = paginaTopo.querySelector('.face.verso');
        if (faceVerso) {
            faceVerso.innerHTML = '';
            for (const node of leftPage.children) {
                faceVerso.appendChild(node.cloneNode(true));
            }
            const tituloNoVerso = faceVerso.querySelector('.content h1');
            const tituloProximo = historia[proximoEstado.passagemId].titulo;
            if (tituloNoVerso) {
                tituloNoVerso.textContent = tituloProximo;
            }
        }
        renderizarPaginaDireita(paginaFundo, proximoEstado);
    }

    /**
     * Inicia a transição animada.
     * MODIFICADO: Adicionado parâmetro 'salvarNoHistorico'.
     */
    function iniciarTransicao(proximoEstado, salvarNoHistorico = true) {
        if (isAnimating) return;
        isAnimating = true;

        if (salvarNoHistorico) {
            historicoDeEstados.push({ ...estadoAtual });
        }

        prepararTransicao(proximoEstado);
        
        const onAnimationEnd = () => {
            leftPage.querySelector('.content').innerHTML = `<h1>${historia[proximoEstado.passagemId].titulo}</h1>`;

            const paginaAntiga = paginaTopo;
            paginaAntiga.classList.remove('virando');
            rightPageContainer.classList.remove('em-primeiro-plano');
            
            paginaAntiga.classList.remove('pagina-topo');
            paginaAntiga.classList.add('pagina-fundo');
            
            const paginaNova = paginaFundo;
            paginaNova.classList.remove('pagina-fundo');
            paginaNova.classList.add('pagina-topo');
            
            atualizarReferenciasDOM();
            estadoAtual = proximoEstado;
            isAnimating = false;
            atualizarEstadoBotoes(); // NOVO: Atualiza estado do botão
        };
        
        rightPageContainer.classList.add('em-primeiro-plano');
        paginaTopo.addEventListener('animationend', onAnimationEnd, { once: true });
        void paginaTopo.offsetHeight;
        paginaTopo.classList.add('virando');
    }
    
    function atualizarReferenciasDOM() {
        paginaTopo = document.querySelector('.pagina-topo');
        paginaFundo = document.querySelector('.pagina-fundo');
    }

    function virarPagina() {
        if (isAnimating) return;
        const paginas = historia[estadoAtual.passagemId].texto.split('---');
        if (estadoAtual.subPagina < paginas.length - 1) {
            iniciarTransicao({ ...estadoAtual, subPagina: estadoAtual.subPagina + 1 });
        }
    }

    function fazerEscolha(destinoId) {
        if (isAnimating) return;
        if (historia[destinoId]) {
            iniciarTransicao({ passagemId: destinoId, subPagina: 0 });
        }
    }

    /**
     * NOVO: Função para voltar à página anterior.
     */
    function voltarPagina() {
        if (isAnimating || historicoDeEstados.length === 0) {
            return;
        }
        const estadoAnterior = historicoDeEstados.pop();
        // O "false" impede que o ato de "voltar" seja salvo no histórico
        iniciarTransicao(estadoAnterior, false);
    }
    
    // --- INICIALIZAÇÃO DO JOGO ---
    function init() {
        rightPageContainer.innerHTML = `
            <div id="pagina-A" class="pagina-direita-efeito pagina-topo"></div>
            <div id="pagina-B" class="pagina-direita-efeito pagina-fundo"></div>`;
        atualizarReferenciasDOM();
        
        leftPage.querySelector('.content').innerHTML = `<h1>${historia[estadoAtual.passagemId].titulo}</h1>`;
        renderizarPaginaDireita(paginaTopo, estadoAtual);
        
        rightPageContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('next-page-btn')) {
                virarPagina();
            }
        });
        
        // NOVO: Adiciona listener para o botão de voltar
        prevPageBtn = document.getElementById('prev-page-btn');
        prevPageBtn.addEventListener('click', voltarPagina);
        
        // Listeners do Modal
        const optionsBtn = document.getElementById('options-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const modalOverlay = document.getElementById('modal-overlay');
        const optionsModal = document.getElementById('options-modal');
        function abrirMenu() { if (isAnimating) return; modalOverlay.classList.remove('hidden'); optionsModal.classList.remove('hidden'); }
        function fecharMenu() { modalOverlay.classList.add('hidden'); optionsModal.classList.add('hidden'); }
        optionsBtn.addEventListener('click', abrirMenu);
        closeModalBtn?.addEventListener('click', fecharMenu);
        modalOverlay.addEventListener('click', fecharMenu);

        // PLACEHOLDER PARA OS NOVOS BOTÕES
        const extrasBtn = document.getElementById('extras-btn');
        const notasBtn = document.getElementById('notas-btn');
        const conquistasBtn = document.getElementById('conquistas-btn');

        extrasBtn.addEventListener('click', () => {
            console.log("Botão Extras clicado!");
        });

        notasBtn.addEventListener('click', () => {
            console.log("Botão Notas clicado!");
        });

        conquistasBtn.addEventListener('click', () => {
            console.log("Botão Conquistas clicado!");
        });

        atualizarEstadoBotoes(); // NOVO: Garante que o botão comece desabilitado
    }
    
    init();
});