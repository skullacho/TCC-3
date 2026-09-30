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
            <h1>Imóvel não encontrado</h1>
            <p>ID do imóvel não informado.</p>
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
            <h1>Imóvel não encontrado</h1>

            <p>
                Não foi possível carregar
                este imóvel.
            </p>
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

        </section>

    `;
}


carregarImovel();
