document.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // CONFIGURAÇÃO DA API
    // ==========================

    const API = "https://tcc-3-nnmd.onrender.com/api/imoveis";

    let todosImoveis = [];
    let imoveisExibidos = [];


    // ==========================
    // MENU MOBILE TOGGLE
    // ==========================

    window.toggleMenu = function () {
        const nav = document.getElementById("nav-container");

        if (nav) {
            nav.classList.toggle("active");
        }
    };


    // ==========================
    // ELEMENTOS DA PÁGINA
    // ==========================

    const container = document.querySelector(".cards-container");
    const contador = document.getElementById("contador");
    const btnFiltrar = document.querySelector(".btn-filtrar");
    const selectOrdenar = document.getElementById("ordenar");


    // ==========================
    // CARREGAR IMÓVEIS DA API
    // ==========================

    async function carregarImoveis() {

        if (!container) return;

        container.innerHTML = `
            <p style="padding: 20px;">
                Carregando imóveis...
            </p>
        `;

        try {

            const resposta = await fetch(API);

            if (!resposta.ok) {
                throw new Error("Erro ao buscar imóveis");
            }

            const imoveis = await resposta.json();

            todosImoveis = imoveis;
            imoveisExibidos = [...imoveis];

            renderizarImoveis(imoveis);

        } catch (error) {

            console.error("Erro ao carregar imóveis:", error);

            container.innerHTML = `
                <p style="padding: 20px;">
                    Não foi possível carregar os imóveis.
                </p>
            `;

            atualizarContador(0);
        }
    }


    // ==========================
    // RENDERIZAR CARDS
    // ==========================

    function renderizarImoveis(imoveis) {

        if (!container) return;

        container.innerHTML = "";

        if (imoveis.length === 0) {

            container.innerHTML = `
                <p style="padding: 20px;">
                    Nenhum imóvel encontrado.
                </p>
            `;

            atualizarContador(0);
            return;
        }


        imoveis.forEach(imovel => {

            const card = document.createElement("div");

            card.className = "card";

            card.dataset.id = imovel._id;
            card.dataset.tipo = normalizar(imovel.tipo);
            card.dataset.cidade = normalizar(imovel.cidade);
            card.dataset.bairro = normalizar(imovel.bairro);
            card.dataset.preco = imovel.preco || 0;


            // ==========================
            // IMAGEM
            // ==========================

            const imagem =
                imovel.imagens &&
                imovel.imagens.length > 0
                    ? imovel.imagens[0]
                    : "https://via.placeholder.com/600x400?text=Sem+imagem";


            // ==========================
            // TAG
            // ==========================

            let tag = "";

            if (imovel.lancamento) {
                tag = "LANÇAMENTO";
            } else if (imovel.destaque) {
                tag = "DESTAQUE";
            }


            // ==========================
            // PREÇO
            // ==========================

            const preco = Number(imovel.preco || 0).toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );


            // ==========================
            // INFORMAÇÕES
            // ==========================

            const area =
                imovel.area && imovel.area > 0
                    ? `${imovel.area}m²`
                    : "-";

            const quartos =
                imovel.quartos && imovel.quartos > 0
                    ? `${imovel.quartos} quartos`
                    : "-";

            const vagas =
                imovel.vagas && imovel.vagas > 0
                    ? `${imovel.vagas} vagas`
                    : "-";

            const banheiros =
                imovel.banheiros && imovel.banheiros > 0
                    ? `${imovel.banheiros} banhos`
                    : "-";


            // ==========================
            // CARD
            // ==========================

            card.innerHTML = `

                <div class="card-image">

                    <img
                        src="${imagem}"
                        alt="${imovel.titulo || "Imóvel"}"
                    >

                    ${
                        tag
                            ? `<span class="tag">${tag}</span>`
                            : ""
                    }

                </div>


                <div class="card-content">

                    <h3>
                        ${imovel.bairro || ""}
                        ${imovel.cidade ? ` | ${imovel.cidade}` : ""}
                    </h3>

                    <p class="descricao">
                        ${imovel.titulo || "Imóvel"}
                    </p>

                    <p class="preco">
                        ${preco}
                    </p>

                </div>


                <div class="divider"></div>


                <div class="toggle-btn">

                    <i class="fa-solid fa-chevron-down"></i>

                </div>


                <div class="extra-info">

                    <div class="info">

                        <span>${area}</span>

                        <span>${quartos}</span>

                        <span>${vagas}</span>

                        <span>${banheiros}</span>

                    </div>

                </div>
            `;


            // ==========================
            // ABRIR / FECHAR DETALHES
            // ==========================

            const toggleBtn = card.querySelector(".toggle-btn");

            toggleBtn.addEventListener("click", (event) => {

                event.stopPropagation();

                card.classList.toggle("active");

            });


            // ==========================
            // ABRIR PÁGINA DO IMÓVEL
            // ==========================

            card.addEventListener("click", () => {

                window.location.href =
                    `../imovel/index.html?id=${imovel._id}`;

            });


            container.appendChild(card);

        });


        atualizarContador(imoveis.length);
    }


    // ==========================
    // CONTADOR
    // ==========================

    function atualizarContador(quantidade) {

        if (contador) {

            contador.textContent =
                `${quantidade} imóveis encontrados`;

        }
    }


    // ==========================
    // NORMALIZAR TEXTO
    // ==========================

    function normalizar(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");

    }


    // ==========================
    // FILTRAGEM
    // ==========================

    function filtrarImoveis() {

        const cidade =
            document.getElementById("cidade")?.value || "todos";

        const bairro =
            document.getElementById("bairro")?.value || "todos";

        const precoMin =
            Number(
                document.getElementById("precoMin")?.value
            ) || 0;

        const precoMaxInput =
            document.getElementById("precoMax")?.value;

        const precoMax =
            precoMaxInput
                ? Number(precoMaxInput)
                : Infinity;


        const tiposSelecionados =
            Array.from(
                document.querySelectorAll(".opcoes button.active")
            )
            .map(btn => normalizar(btn.textContent));


        const filtrados = todosImoveis.filter(imovel => {

            let mostrar = true;


            // ==========================
            // CIDADE
            // ==========================

            if (
                cidade !== "todos" &&
                normalizar(imovel.cidade) !== normalizar(cidade)
            ) {

                mostrar = false;

            }


            // ==========================
            // BAIRRO
            // ==========================

            if (
                bairro !== "todos" &&
                normalizar(imovel.bairro) !== normalizar(bairro)
            ) {

                mostrar = false;

            }


            // ==========================
            // TIPO
            // ==========================

            if (
                tiposSelecionados.length > 0 &&
                !tiposSelecionados.includes(normalizar(imovel.tipo))
            ) {

                mostrar = false;

            }


            // ==========================
            // PREÇO
            // ==========================

            const preco = Number(imovel.preco || 0);

            if (
                preco < precoMin ||
                preco > precoMax
            ) {

                mostrar = false;

            }


            return mostrar;

        });


        imoveisExibidos = filtrados;

        aplicarOrdenacao(filtrados);

    }


    // ==========================
    // ORDENAÇÃO
    // ==========================

    function aplicarOrdenacao(imoveis) {

        const ordem =
            selectOrdenar?.value || "Mais relevantes";


        const ordenados = [...imoveis];


        if (ordem === "Menor preço") {

            ordenados.sort(
                (a, b) =>
                    Number(a.preco || 0) -
                    Number(b.preco || 0)
            );

        }


        if (ordem === "Maior preço") {

            ordenados.sort(
                (a, b) =>
                    Number(b.preco || 0) -
                    Number(a.preco || 0)
            );

        }


        renderizarImoveis(ordenados);

    }


    // ==========================
    // BOTÕES DE TIPO
    // ==========================

    document
        .querySelectorAll(".opcoes button")
        .forEach(btn => {

            btn.addEventListener("click", () => {

                btn.classList.toggle("active");

            });

        });


    // ==========================
    // BOTÃO FILTRAR
    // ==========================

    if (btnFiltrar) {

        btnFiltrar.addEventListener(
            "click",
            filtrarImoveis
        );

    }


    // ==========================
    // ORDENAÇÃO
    // ==========================

    if (selectOrdenar) {

        selectOrdenar.addEventListener(
            "change",
            () => {

                aplicarOrdenacao(imoveisExibidos);

            }
        );

    }


    // ==========================
    // INICIAR
    // ==========================

    carregarImoveis();

});
