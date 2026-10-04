const API =
    "https://tcc-3-nnmd.onrender.com/api/imoveis";


// ========================================
// ELEMENTOS
// ========================================

const form =
    document.getElementById("formImovel");

const lista =
    document.getElementById("listaImoveis");

const mensagem =
    document.getElementById("mensagem");

const textoLocalizacao =
    document.getElementById("textoLocalizacao");


// ========================================
// VARIÁVEIS DA LOCALIZAÇÃO
// ========================================

let latitudeSelecionada = null;

let longitudeSelecionada = null;

let marcador = null;

let mapa = null;


// ========================================
// CRIAR MAPA
// ========================================

function iniciarMapa() {

    const elementoMapa =
        document.getElementById(
            "mapaCadastro"
        );


    if (!elementoMapa) {

        console.error(
            "Elemento #mapaCadastro não encontrado."
        );

        return;
    }


    if (typeof L === "undefined") {

        console.error(
            "Leaflet não foi carregado."
        );

        elementoMapa.innerHTML = `
            <div class="erro-mapa">
                Não foi possível carregar o mapa.
            </div>
        `;

        return;
    }


    // ========================================
    // CRIAR MAPA
    // ========================================

    mapa =
        L.map(
            "mapaCadastro"
        ).setView(
            [-22.9056, -47.0608],
            13
        );


    // ========================================
    // OPENSTREETMAP
    // ========================================

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(mapa);


    // ========================================
    // CLIQUE
    // ========================================

    mapa.on(
        "click",
        function (event) {

            latitudeSelecionada =
                event.latlng.lat;

            longitudeSelecionada =
                event.latlng.lng;


            // Se já existe marcador,
            // apenas mover.

            if (marcador) {

                marcador.setLatLng(
                    event.latlng
                );

            } else {

                marcador =
                    L.marker(
                        event.latlng
                    ).addTo(
                        mapa
                    );

            }


            marcador
                .bindPopup(
                    "Localização do imóvel"
                )
                .openPopup();


            textoLocalizacao.textContent =
                "Localização selecionada ✓";


            textoLocalizacao.classList.add(
                "selecionada"
            );

        }
    );


    // Corrige possíveis problemas
    // de tamanho do Leaflet.

    setTimeout(
        function () {

            mapa.invalidateSize();

        },
        200
    );

}


// ========================================
// CADASTRAR
// ========================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // ========================================
        // LOCALIZAÇÃO OBRIGATÓRIA
        // ========================================

        if (
            latitudeSelecionada === null ||
            longitudeSelecionada === null
        ) {

            mensagem.textContent =
                "Clique no mapa para marcar a localização do imóvel.";

            mensagem.style.color =
                "red";

            return;
        }


        const imagem =
            document
                .getElementById("imagens")
                .value
                .trim();


        // ========================================
        // OBJETO
        // ========================================

        const imovel = {

            titulo:
                document
                    .getElementById("titulo")
                    .value,

            tipo:
                document
                    .getElementById("tipo")
                    .value,

            finalidade:
                document
                    .getElementById("finalidade")
                    .value,

            preco:
                Number(
                    document
                        .getElementById("preco")
                        .value
                ),

            cidade:
                document
                    .getElementById("cidade")
                    .value,

            bairro:
                document
                    .getElementById("bairro")
                    .value,

            endereco:
                document
                    .getElementById("endereco")
                    .value,


            // LOCALIZAÇÃO

            latitude:
                latitudeSelecionada,

            longitude:
                longitudeSelecionada,


            area:
                Number(
                    document
                        .getElementById("area")
                        .value
                ),

            quartos:
                Number(
                    document
                        .getElementById("quartos")
                        .value
                ),

            banheiros:
                Number(
                    document
                        .getElementById("banheiros")
                        .value
                ),

            vagas:
                Number(
                    document
                        .getElementById("vagas")
                        .value
                ),

            descricao:
                document
                    .getElementById("descricao")
                    .value,

            imagens:
                imagem
                    ? [imagem]
                    : [],

            caracteristicas:
                [],

            destaque:
                document
                    .getElementById("destaque")
                    .checked,

            lancamento:
                false

        };


        // ========================================
        // POST
        // ========================================

        try {

            mensagem.textContent =
                "Cadastrando imóvel...";

            mensagem.style.color =
                "#333";


            const resposta =
                await fetch(
                    API,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                imovel
                            )
                    }
                );


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.erro ||
                    "Erro ao cadastrar"
                );

            }


            // ========================================
            // SUCESSO
            // ========================================

            mensagem.textContent =
                "Imóvel cadastrado com sucesso!";

            mensagem.style.color =
                "green";


            // Limpar formulário

            form.reset();


            // Limpar localização

            latitudeSelecionada =
                null;

            longitudeSelecionada =
                null;


            textoLocalizacao.textContent =
                "Nenhuma localização selecionada";

            textoLocalizacao.classList.remove(
                "selecionada"
            );


            // Limpar marcador

            if (marcador) {

                mapa.removeLayer(
                    marcador
                );

                marcador =
                    null;

            }


            // Voltar mapa

            mapa.setView(
                [-22.9056, -47.0608],
                13
            );


            carregarImoveis();


        } catch (error) {

            console.error(
                "Erro no cadastro:",
                error
            );


            mensagem.textContent =
                "Erro ao cadastrar imóvel.";

            mensagem.style.color =
                "red";

        }

    }
);


// ========================================
// CARREGAR IMÓVEIS
// ========================================

async function carregarImoveis() {

    try {

        const resposta =
            await fetch(API);


        if (!resposta.ok) {

            throw new Error(
                "Erro ao carregar imóveis"
            );

        }


        const imoveis =
            await resposta.json();


        lista.innerHTML =
            "";


        if (
            !Array.isArray(imoveis) ||
            imoveis.length === 0
        ) {

            lista.innerHTML = `
                <p>
                    Nenhum imóvel cadastrado.
                </p>
            `;

            return;
        }


        imoveis.forEach(
            function (imovel) {

                const elemento =
                    document.createElement(
                        "div"
                    );


                elemento.className =
                    "imovel";


                const preco =
                    Number(
                        imovel.preco || 0
                    ).toLocaleString(
                        "pt-BR"
                    );


                elemento.innerHTML = `

                    <div class="imovel-info">

                        <h3>
                            ${imovel.titulo}
                        </h3>

                        <p>
                            ${imovel.bairro}
                            -
                            ${imovel.cidade}
                        </p>

                        <p>
                            R$ ${preco}
                        </p>

                        <p>
                            ${imovel.tipo}
                            -
                            ${imovel.finalidade}
                        </p>

                        ${
                            imovel.latitude != null &&
                            imovel.longitude != null

                            ? `
                                <p class="localizacao-cadastrada">
                                    📍 Localização cadastrada
                                </p>
                            `

                            : `
                                <p class="localizacao-nao-cadastrada">
                                    Localização não cadastrada
                                </p>
                            `
                        }

                    </div>


                    <button
                        class="btn-excluir"
                        onclick="excluirImovel('${imovel._id}')"
                    >
                        Excluir
                    </button>

                `;


                lista.appendChild(
                    elemento
                );

            }
        );


    } catch (error) {

        console.error(
            "Erro ao carregar imóveis:",
            error
        );


        lista.innerHTML = `
            <p>
                Erro ao carregar imóveis.
            </p>
        `;

    }

}


// ========================================
// EXCLUIR
// ========================================

async function excluirImovel(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este imóvel?"
        );


    if (!confirmar) {

        return;

    }


    try {

        const resposta =
            await fetch(
                `${API}/${id}`,
                {
                    method:
                        "DELETE"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao excluir"
            );

        }


        carregarImoveis();


    } catch (error) {

        console.error(
            error
        );


        alert(
            "Não foi possível excluir o imóvel."
        );

    }

}


// ========================================
// INICIAR
// ========================================

iniciarMapa();

carregarImoveis();