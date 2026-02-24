# 📖 O Diário de Elise

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-8c573f?style=for-the-badge)
![Tecnologias](https://img.shields.io/badge/Tecnologias-HTML5_%7C_CSS3_%7C_Vanilla_JS-386641?style=for-the-badge)

**O Diário de Elise** é um jogo de ficção interativa (Visual Novel/Text Adventure) focado na narrativa e na imersão. Através das páginas de um diário desgastado pelo tempo, o jogador acompanha os pensamentos, medos e escolhas de uma protagonista em busca de um recomeço em uma nova cidade, enquanto lida com as sombras do cotidiano e mistérios sutis.

---

## 🌧️ Sinopse

Deixando São Paulo para trás, Elise chega a Joinville sob uma chuva fina e um céu melancólico. Em um apartamento vazio e lidando com o peso de dívidas antigas, ela consegue um novo emprego que promete ser seu recomeço. No entanto, o ambiente de trabalho hostil, a solidão das ruas nubladas e a constante sensação de estar sendo observada começam a cobrar seu preço. 

Até onde você iria para não desistir? O que realmente se esconde no silêncio da cidade? 

---

## ✨ Funcionalidades e Mecânicas

O projeto foi desenhado para simular a experiência tátil e visual de ler um diário antigo, aliando tecnologias web para criar imersão:

* **📘 Sistema de Virada de Páginas em 3D:** Animações CSS complexas (`rotateY`, `box-shadow` dinâmicas) que simulam o movimento físico e a dobra de páginas de papel.
* **🎧 Gerenciador de Áudio Imersivo:** Um sistema de áudio integrado que transita suavemente entre músicas de fundo (BGM) e efeitos sonoros (SFX) dependendo do ambiente e da tensão da cena lida.
* **🔀 Narrativa Ramificada:** Múltiplos caminhos e escolhas que moldam o destino de Elise, afetando suas interações no trabalho e sua percepção da realidade.
* **🎨 UI/UX Atmosférica:** Paleta de cores terrosas e melancólicas, uso de texturas (couro, madeira escurecida, papel envelhecido) e tipografia elegante (Spectral SC, Caveat, EB Garamond).
* **🔖 Abas Interativas:** Fitas laterais estilizadas para acesso rápido a Opções, Extras, Notas e Conquistas.

---

## 🛠️ Tecnologias Utilizadas

O jogo foi construído inteiramente com tecnologias web nativas, sem uso de frameworks ou bibliotecas pesadas de terceiros, garantindo leveza e controle total sobre o DOM:

* **HTML5:** Estruturação semântica do contêiner do diário e das páginas.
* **CSS3:** Variáveis (Custom Properties), Grid Layout para alinhamento central, Flexbox, Animações e Transições avançadas (`@keyframes`).
* **JavaScript (Vanilla):** Lógica de progressão da história, injeção dinâmica de conteúdo HTML, gerenciamento de estado (passado/futuro) e controle de mídias de áudio.

---

## 📂 Estrutura do Projeto

```text
📁 diario-de-elise/
│
├── 📄 index.html         # Estrutura principal da interface e modais
├── 📁 assets/
│   ├── 📁 css/
│   │   └── 📄 style.css  # Estilos globais, temas, animações e layout
│   ├── 📁 js/
│   │   ├── 📄 main.js    # Motor do jogo (DOM, transições, áudio)
│   │   └── 📄 story.js   # Banco de dados da narrativa (JSON-like)
│   └── 📁 audio/         # (A adicionar) Arquivos mp3 para BGM e SFX
