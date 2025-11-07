document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const leftPage = document.getElementById('left-page');
    const rightPageContainer = document.getElementById('right-page-container');
    const prevPageBtn = document.getElementById('prev-page-btn'); // NOVO: Botão de retrocesso
    let paginaTopo, paginaFundo; // Páginas da direita que alternam

    // --- ESTADO DO JOGO ---
    let estadoAtual = { passagemId: 'prologo', subPagina: 0 };
    let historico = []; // NOVO: Armazena estados anteriores para retrocesso
    let isAnimating = false;

    // --- GERENCIADOR DE ÁUDIO (Mecânica "show, play, hide" para áudio) ---
    const soundManager = {
        bgmAtual: null,
        // ATENÇÃO: Estes são caminhos EXEMPIFICADOS. 
        // Você deve criar e fornecer os arquivos de áudio em './assets/audio/'
        caminhosAudio: {
            virar_pagina: './assets/audio/page_flip.mp3', // SFX
            chuva_leve: './assets/audio/rain.mp3',
            silencio_rua: './assets/audio/city_ambience.mp3',
            musica_calma: './assets/audio/calm_music.mp3',
            relogio_tic_tac: './assets/audio/clock_tick.mp3',
            passos_na_rua: './assets/audio/footsteps.mp3',
            lamentos_cidade: './assets/audio/melancholy_city.mp3',
            cafe_e_conversas: './assets/audio/cafe_chatter.mp3',
            escritorio_movimentado: './assets/audio/office_busy.mp3',
            suspense_sombrio: './assets/audio/dark_suspense.mp3',
            clima_tenso: './assets/audio/tense_music.mp3',
        },

        playBGM: function(soundId) {
            this.stopBGM(); // Para qualquer BGM anterior
            const caminho = this.caminhosAudio[soundId];
            if (caminho) {
                this.bgmAtual = new Audio(caminho);
                this.bgmAtual.loop = true;
                this.bgmAtual.volume = 0.4; // Volume baixo para ambiente
                this.bgmAtual.play().catch(e => console.log("Erro ao tentar tocar BGM: " + e));
            }
        },

        stopBGM: function() {
            if (this.bgmAtual) {
                this.bgmAtual.pause();
                this.bgmAtual.currentTime = 0;
                this.bgmAtual = null;
            }
        },

        playSFX: function(soundId) {
            const caminho = this.caminhosAudio[soundId];
            if (caminho) {
                const sfx = new Audio(caminho);
                sfx.volume = 0.8; // Volume normal para efeito
                sfx.play().catch(e => console.log("Erro ao tentar tocar SFX: " + e));
            }
        }
    };

    /**
     * Renderiza o conteúdo de um estado na página da direita.
     */
    function renderizarPaginaDireita(pageElement, estado) {
        const passagem = historia[estado.passagemId];
        if (!passagem) return;

        // Limpa e recria a estrutura da página
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
        
        // Divide o texto pelo separador HTML
        const paginas = passagem.texto.split('<hr class=\'ornamental-separator\'>');
        const textoDaSubPagina = paginas[estado.subPagina].trim().replace(/\n/g, '<br>');
        
        // Lógica para aplicar a classe 'no-cap' se não for a primeira subpágina
        const classeCapitular = (estado.subPagina > 0) ? 'class="no-cap"' : '';
        
        contentDiv.innerHTML = `<p ${classeCapitular}>${textoDaSubPagina}</p>`;
        
        if (estado.subPagina < paginas.length - 1) {
            // Se houver mais subpáginas, renderiza o botão de avançar.
            btnNext.classList.remove('hidden');
            choicesDiv.classList.add('hidden');
        } else {
            // Se for a última subpágina, mostra as escolhas.
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
     * @param {Object} proximoEstado O estado para onde o jogador está indo.
     * @param {string} direcao 'avancar' ou 'retroceder'.
     */
    function prepararTransicao(proximoEstado, direcao) {
        // A página que virá será a página 'topo'
        const faceVerso = paginaTopo.querySelector('.face.verso');

        // Se estiver AVANÇANDO, o verso do 'topo' recebe o conteúdo da esquerda
        if (direcao === 'avancar' && faceVerso) {
            faceVerso.innerHTML = '';
            // Clona a estrutura da página esquerda para manter a formatação.
            for (const node of leftPage.children) {
                faceVerso.appendChild(node.cloneNode(true));
            }

            // Encontra o título no clone e o atualiza com o título da PRÓXIMA página.
            const tituloNoVerso = faceVerso.querySelector('.content h1');
            const tituloProximo = historia[proximoEstado.passagemId].titulo;
            if (tituloNoVerso) {
                tituloNoVerso.textContent = tituloProximo;
            }
        }
        
        // A página de baixo (fundo) SEMPRE recebe o conteúdo da PRÓXIMA página
        renderizarPaginaDireita(paginaFundo, proximoEstado);
    }
    
    /**
     * Função para gerenciar o som ambiente (BGM)
     */
    function gerenciarSomAmbiente(passagemId) {
        const proximoSom = historia[passagemId]?.som_ambiente;
        const caminhoAtual = soundManager.bgmAtual ? soundManager.bgmAtual.src.split('/').pop().split('.')[0] : null;

        if (proximoSom && proximoSom !== caminhoAtual) {
            soundManager.playBGM(proximoSom);
        } else if (!proximoSom && caminhoAtual) {
            soundManager.stopBGM(); 
        }
    }

    /**
     * Inicia a transição animada.
     * @param {Object} proximoEstado O estado para onde o jogador está indo.
     * @param {string} direcao 'avancar' ou 'retroceder'.
     */
    function iniciarTransicao(proximoEstado, direcao = 'avancar') {
        if (isAnimating) return;
        isAnimating = true;

        soundManager.playSFX('virar_pagina'); 

        // Adiciona ou remove o estado atual do histórico ANTES da transição
        if (direcao === 'avancar') {
            historico.push(estadoAtual);
        } else if (direcao === 'retroceder') {
            // O estado já foi retirado em 'voltarPagina'
        }

        prepararTransicao(proximoEstado, direcao);
        
        const onAnimationEnd = () => {
            // Remove as classes de animação
            const animClasses = ['avancando', 'retrocedendo', 'em-primeiro-plano'];
            
            paginaTopo.classList.remove(...animClasses);
            rightPageContainer.classList.remove('em-primeiro-plano');

            // Atualiza o título esquerdo
            leftPage.querySelector('.content').innerHTML = `<h1>${historia[proximoEstado.passagemId].titulo}</h1>`;
            
            // Troca os papéis das páginas (topo vira fundo, fundo vira topo)
            const paginaAntiga = paginaTopo;
            paginaAntiga.classList.remove('pagina-topo');
            paginaAntiga.classList.add('pagina-fundo');
            
            const paginaNova = paginaFundo;
            paginaNova.classList.remove('pagina-fundo');
            paginaNova.classList.add('pagina-topo');
            
            atualizarReferenciasDOM();
            estadoAtual = proximoEstado;
            isAnimating = false;
            
            // Gerencia a visibilidade do botão de retrocesso
            prevPageBtn.style.visibility = historico.length > 0 ? 'visible' : 'hidden';

            // Garante que o botão de avançar na subpágina seja visível se necessário
            const btnNext = paginaTopo.querySelector('.next-page-btn');
            const paginas = historia[estadoAtual.passagemId].texto.split('<hr class=\'ornamental-separator\'>');
            if (btnNext && estadoAtual.subPagina < paginas.length - 1) {
                btnNext.classList.remove('hidden');
            }

            // Gerencia o som ambiente
            gerenciarSomAmbiente(estadoAtual.passagemId); 
        };
        
        // Remove listeners de segurança
        paginaTopo.removeEventListener('animationend', onAnimationEnd);
        
        // Adiciona a classe de animação correta
        paginaTopo.classList.add(direcao === 'avancar' ? 'avancando' : 'retrocedendo');
        
        // Garante que a página esteja no topo durante a virada
        rightPageContainer.classList.add('em-primeiro-plano');
        
        // Adiciona o listener para a nova animação
        paginaTopo.addEventListener('animationend', onAnimationEnd, { once: true });
        void paginaTopo.offsetHeight; // Força reflow
    }
    
    function atualizarReferenciasDOM() {
        paginaTopo = document.querySelector('.pagina-topo');
        paginaFundo = document.querySelector('.pagina-fundo');
    }

    /**
     * Avança para a próxima subpágina.
     */
    function virarPagina() {
        if (isAnimating) return;
        // Divide o texto pelo separador HTML
        const paginas = historia[estadoAtual.passagemId].texto.split('<hr class=\'ornamental-separator\'>');
        if (estadoAtual.subPagina < paginas.length - 1) {
            iniciarTransicao({ ...estadoAtual, subPagina: estadoAtual.subPagina + 1 }, 'avancar');
        }
    }

    /**
     * Inicia um novo ramo narrativo.
     */
    function fazerEscolha(destinoId) {
        if (isAnimating) return;
        if (historia[destinoId]) {
            // NOTA: O histórico só deve ser limpo se for um "novo" capítulo,
            // mas por simplificação da regra, mantemos como está.
            iniciarTransicao({ passagemId: destinoId, subPagina: 0 }, 'avancar');
        }
    }
    
    /**
     * Retrocede para o estado anterior no histórico.
     */
    function voltarPagina() {
        if (isAnimating || historico.length === 0) return;
        
        // Pega o estado anterior e o remove da pilha (pop)
        const estadoAnterior = historico.pop();
        
        // 1. Inverte os papéis das páginas para preparar a animação de retrocesso (vira da esquerda para a direita)
        paginaTopo.classList.remove('pagina-topo');
        paginaTopo.classList.add('pagina-fundo');
        
        paginaFundo.classList.remove('pagina-fundo');
        paginaFundo.classList.add('pagina-topo');
        
        // 2. Atualiza as referências DOM
        atualizarReferenciasDOM();
        
        // 3. Inicia a transição no sentido 'retroceder'
        iniciarTransicao(estadoAnterior, 'retroceder');

        // O estadoAtual será atualizado no `onAnimationEnd`.
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    function init() {
        rightPageContainer.innerHTML = `
            <div id="pagina-A" class="pagina-direita-efeito pagina-topo"></div>
            <div id="pagina-B" class="pagina-direita-efeito pagina-fundo"></div>`;
        atualizarReferenciasDOM();
        
        leftPage.querySelector('.content').innerHTML = `<h1>${historia[estadoAtual.passagemId].titulo}</h1>`;
        renderizarPaginaDireita(paginaTopo, estadoAtual);
        
        // O botão de retrocesso fica invisível no início do jogo
        prevPageBtn.style.visibility = 'hidden'; 

        // Inicia o som ambiente da primeira passagem
        gerenciarSomAmbiente(estadoAtual.passagemId);
        
        // Listener para AVANÇAR página
        rightPageContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('next-page-btn')) {
                virarPagina();
            }
        });

        // Listener para RETROCEDER página
        prevPageBtn.addEventListener('click', voltarPagina);
        
        // Listeners do Modal (mantidos)
        const optionsBtn = document.getElementById('options-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const modalOverlay = document.getElementById('modal-overlay');
        const optionsModal = document.getElementById('options-modal');
        function abrirMenu() { 
             if (isAnimating) return; 
             modalOverlay.classList.remove('hidden'); 
             optionsModal.classList.remove('hidden'); 
        }
        function fecharMenu() { 
            modalOverlay.classList.add('hidden'); 
            optionsModal.classList.add('hidden'); 
        }
        optionsBtn.addEventListener('click', abrirMenu);
        closeModalBtn?.addEventListener('click', fecharMenu);
        modalOverlay.addEventListener('click', fecharMenu);

        // PLACEHOLDER PARA OS NOVOS BOTÕES
        const extrasBtn = document.getElementById('extras-btn');
        const notasBtn = document.getElementById('notas-btn');
        const conquistasBtn = document.getElementById('conquistas-btn');

        extrasBtn.addEventListener('click', () => {
            console.log("Botão Extras clicado! (Futuro Modal de Extras)");
        });

        notasBtn.addEventListener('click', () => {
            console.log("Botão Notas clicado! (Futuro Modal de Notas)");
        });

        conquistasBtn.addEventListener('click', () => {
            console.log("Botão Conquistas clicado! (Futuro Modal de Conquistas)");
        });
    }
    
    init();
});