document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DO DOM ---
    const leftPage = document.getElementById('left-page');
    const rightPageContainer = document.getElementById('right-page-container');
    let paginaTopo, paginaFundo; // Páginas da direita que alternam

    // --- ESTADO DO JOGO ---
    let estadoAtual = { passagemId: 'prologo', subPagina: 0 };
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
                // É necessário um 'catch' para evitar erros de promessa em alguns navegadores
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
        
        // CORREÇÃO: agora divide o texto pelo novo separador HTML
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
     */
    function prepararTransicao(proximoEstado) {
        const faceVerso = paginaTopo.querySelector('.face.verso');
        if (faceVerso) {
            faceVerso.innerHTML = '';
            // Clona a estrutura da página esquerda para manter a formatação.
            for (const node of leftPage.children) {
                faceVerso.appendChild(node.cloneNode(true));
            }

            // Encontra o título no clone...
            const tituloNoVerso = faceVerso.querySelector('.content h1');
            // ...e o atualiza com o título da PRÓXIMA página.
            const tituloProximo = historia[proximoEstado.passagemId].titulo;
            if (tituloNoVerso) {
                tituloNoVerso.textContent = tituloProximo;
            }
        }
        
        // Prepara a página de baixo com o conteúdo de texto da próxima página.
        renderizarPaginaDireita(paginaFundo, proximoEstado);
    }
    
    /**
     * Função para gerenciar o som ambiente (BGM)
     */
    function gerenciarSomAmbiente(passagemId) {
        const proximoSom = historia[passagemId]?.som_ambiente;
        const caminhoAtual = soundManager.bgmAtual ? soundManager.bgmAtual.src.split('/').pop().split('.')[0] : null;

        // Se o som ambiente é diferente do atual, muda
        if (proximoSom && proximoSom !== caminhoAtual) {
            soundManager.playBGM(proximoSom);
        } else if (!proximoSom && caminhoAtual) {
            soundManager.stopBGM(); // Para se não houver mais som
        }
    }

    /**
     * Inicia a transição animada.
     */
    function iniciarTransicao(proximoEstado) {
        if (isAnimating) return;
        isAnimating = true;

        // Toca o som de virar página (SFX)
        soundManager.playSFX('virar_pagina'); 

        prepararTransicao(proximoEstado);
        
        const onAnimationEnd = () => {
            // Atualiza o título esquerdo só depois da animação.
            leftPage.querySelector('.content').innerHTML = `<h1>${historia[proximoEstado.passagemId].titulo}</h1>`;

            const paginaAntiga = paginaTopo;
            paginaAntiga.classList.remove('virando', 'em-primeiro-plano');
            
            // Troca os papéis das páginas.
            paginaAntiga.classList.remove('pagina-topo');
            paginaAntiga.classList.add('pagina-fundo');
            
            const paginaNova = paginaFundo;
            paginaNova.classList.remove('pagina-fundo');
            paginaNova.classList.add('pagina-topo');
            
            atualizarReferenciasDOM();
            estadoAtual = proximoEstado;
            isAnimating = false;
            
            // Gerencia o som ambiente para a nova passagem
            gerenciarSomAmbiente(estadoAtual.passagemId); 
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
        // Divide o texto pelo separador HTML
        const paginas = historia[estadoAtual.passagemId].texto.split('<hr class=\'ornamental-separator\'>');
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
    
    // --- INICIALIZAÇÃO DO JOGO ---
    function init() {
        rightPageContainer.innerHTML = `
            <div id="pagina-A" class="pagina-direita-efeito pagina-topo"></div>
            <div id="pagina-B" class="pagina-direita-efeito pagina-fundo"></div>`;
        atualizarReferenciasDOM();
        
        leftPage.querySelector('.content').innerHTML = `<h1>${historia[estadoAtual.passagemId].titulo}</h1>`;
        renderizarPaginaDireita(paginaTopo, estadoAtual);
        
        // Inicia o som ambiente da primeira passagem
        gerenciarSomAmbiente(estadoAtual.passagemId);
        
        rightPageContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('next-page-btn')) {
                virarPagina();
            }
        });
        
        // Listeners do Modal
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