const API =
    "https://tcc-3-nnmd.onrender.com/api/imoveis";


const container =
    document.getElementById("imovel");


const params =
    new URLSearchParams(
        window.location.search
    );


const id =
    params.get("id");


async function carregarImovel() {

    if (!id) {

        container.innerHTML = `
            <section class="informacoes">
                <h1>Imóvel não encontrado</h1>
                <p>ID do imóvel não informado.</p>
            </section>
        `;

        return;
    }


    try {

        const resposta =
            await fetch(`${API}/${id}`);


        if (!resposta.ok) {

            throw new Error(
                "Imóvel não encontrado"
            );

        }


        const imovel =
            await resposta.json();


        mostrarImovel(imovel);


    } catch (error) {

        console.error(error);


        container.innerHTML = `
            <section class="informacoes">

                <h1>
                    Imóvel não encontrado
                </h1>

                <p>
                    Não foi possível carregar
                    este imóvel.
                </p>

            </section>
        `;

    }

}


function mostrarImovel(imovel) {

    document.title =
        imovel.titulo;


    const imagem =
        imovel.imagens &&
        imovel.imagens.length > 0

            ? imovel.imagens[0]

            : "https://via.placeholder.com/1200x600?text=Sem+imagem";


    const caracteristicas =
        imovel.caracteristicas || [];


    const possuiLocalizacao =
        imovel.latitude !== null &&
        imovel.latitude !== undefined &&
        imovel.longitude !== null &&
        imovel.longitude !== undefined &&
        !isNaN(Number(imovel.latitude)) &&
        !isNaN(Number(imovel.longitude));


    container.innerHTML = `

        <section class="galeria">

            <img
                src="${imagem}"
                alt="${imovel.titulo}"
            >

        </section>


        <section class="informacoes">

            <p>
                ${imovel.tipo}
            </p>


            <h1>
                ${imovel.titulo}
            </h1>


            <div class="preco">

                R$
                ${Number(imovel.preco)
                    .toLocaleString("pt-BR")}

            </div>


            <p class="localizacao">

                📍
                ${imovel.bairro}
                -
                ${imovel.cidade}

            </p>


            <div class="detalhes">

                <div class="detalhe">

                    <strong>
                        ${imovel.area}
                    </strong>

                    <span>
                        m²
                    </span>

                </div>


                <div class="detalhe">

                    <strong>
                        ${imovel.quartos}
                    </strong>

                    <span>
                        Quartos
                    </span>

                </div>


                <div class="detalhe">

                    <strong>
                        ${imovel.banheiros}
                    </strong>

                    <span>
                        Banheiros
                    </span>

                </div>


                <div class="detalhe">

                    <strong>
                        ${imovel.vagas}
                    </strong>

                    <span>
                        Vagas
                    </span>

                </div>

            </div>


            <h2>
                Descrição
            </h2>


            <p>
                ${imovel.descricao || "Sem descrição."}
            </p>


            <h2>
                Características
            </h2>


            <div class="caracteristicas">

                ${
                    caracteristicas.length > 0

                    ? caracteristicas
                        .map(item => `
                            <span
                                class="caracteristica"
                            >
                                ✓ ${item}
                            </span>
                        `)
                        .join("")

                    : "<p>Nenhuma característica cadastrada.</p>"
                }

            </div>


            <div class="secao-localizacao">

                <h2>
                    Localização
                </h2>

                ${
                    imovel.endereco

                    ? `
                        <p class="endereco-imovel">
                            <i class="fa-solid fa-location-dot"></i>
                            ${imovel.endereco}
                        </p>
                    `

                    : ""
                }


                ${
                    possuiLocalizacao

                    ? `
                        <div id="mapaImovel"></div>
                    `

                    : `
                        <p class="sem-mapa">
                            Localização no mapa não cadastrada
                            para este imóvel.
                        </p>
                    `
                }

            </div>

        </section>

    `;


    // ==========================
    // MAPA DO IMÓVEL
    // ==========================

    if (possuiLocalizacao) {

        const latitude =
            Number(imovel.latitude);

        const longitude =
            Number(imovel.longitude);


        const mapa =
            L.map("mapaImovel").setView(
                [
                    latitude,
                    longitude
                ],
                16
            );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap"
            }
        ).addTo(mapa);


        const marcador =
            L.marker([
                latitude,
                longitude
            ])
            .addTo(mapa);


        marcador.bindPopup(`
            <strong>
                ${imovel.titulo}
            </strong>

            ${
                imovel.endereco

                ? `<br>${imovel.endereco}`

                : ""
            }
        `);

    }

}


carregarImovel();