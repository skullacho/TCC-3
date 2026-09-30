const API = "http://localhost:3000/api/imoveis";


// ========================================
// ELEMENTOS
// ========================================

const form = document.getElementById("formImovel");

const lista = document.getElementById("listaImoveis");

const mensagem = document.getElementById("mensagem");


// ========================================
// CADASTRAR
// ========================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();


    const imovel = {

        titulo:
            document.getElementById("titulo").value,

        tipo:
            document.getElementById("tipo").value,

        finalidade:
            document.getElementById("finalidade").value,

        preco:
            Number(
                document.getElementById("preco").value
            ),

        cidade:
            document.getElementById("cidade").value,

        bairro:
            document.getElementById("bairro").value,

        endereco:
            document.getElementById("endereco").value,

        area:
            Number(
                document.getElementById("area").value
            ),

        quartos:
            Number(
                document.getElementById("quartos").value
            ),

        banheiros:
            Number(
                document.getElementById("banheiros").value
            ),

        vagas:
            Number(
                document.getElementById("vagas").value
            ),

        descricao:
            document.getElementById("descricao").value,

        imagens: [
            document.getElementById("imagens").value
        ],

        caracteristicas: [],

        destaque:
            document.getElementById("destaque").checked,

        lancamento: false
    };


    try {

        const resposta = await fetch(API, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(imovel)

        });


        const dados = await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.erro || "Erro ao cadastrar"
            );

        }


        mensagem.textContent =
            "Imóvel cadastrado com sucesso!";


        mensagem.style.color = "green";


        form.reset();


        carregarImoveis();


    } catch (error) {

        console.error(error);

        mensagem.textContent =
            "Erro ao cadastrar imóvel.";

        mensagem.style.color = "red";

    }

});


// ========================================
// LISTAR
// ========================================

async function carregarImoveis() {

    try {

        const resposta = await fetch(API);

        const imoveis =
            await resposta.json();


        lista.innerHTML = "";


        if (imoveis.length === 0) {

            lista.innerHTML = `
                <p>
                    Nenhum imóvel cadastrado.
                </p>
            `;

            return;
        }


        imoveis.forEach(imovel => {

            const elemento =
                document.createElement("div");


            elemento.className = "imovel";


            elemento.innerHTML = `

                <div class="imovel-info">

                    <h3>
                        ${imovel.titulo}
                    </h3>

                    <p>
                        ${imovel.bairro} -
                        ${imovel.cidade}
                    </p>

                    <p>
                        R$
                        ${imovel.preco.toLocaleString("pt-BR")}
                    </p>

                    <p>
                        ${imovel.tipo} -
                        ${imovel.finalidade}
                    </p>

                </div>


                <button
                    class="btn-excluir"
                    onclick="excluirImovel('${imovel._id}')"
                >
                    Excluir
                </button>

            `;


            lista.appendChild(elemento);

        });


    } catch (error) {

        console.error(error);

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

        const resposta = await fetch(
            `${API}/${id}`,
            {
                method: "DELETE"
            }
        );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao excluir"
            );

        }


        carregarImoveis();


    } catch (error) {

        console.error(error);

        alert(
            "Não foi possível excluir o imóvel."
        );

    }

}


// ========================================
// INICIAR
// ========================================

carregarImoveis();