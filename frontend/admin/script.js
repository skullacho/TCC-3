
const API = "https://tcc-3-nnmd.onrender.com/api/imoveis";

// ========================================
// ELEMENTOS
// ========================================

const form = document.getElementById("formImovel");
const lista = document.getElementById("listaImoveis");
const mensagem = document.getElementById("mensagem");
const textoLocalizacao = document.getElementById("textoLocalizacao");

// ========================================
// VARIÁVEIS
// ========================================

let latitudeSelecionada = null;
let longitudeSelecionada = null;
let marcador = null;
let mapa = null;

let imovelEmEdicao = null;

// ========================================
// AUTENTICAÇÃO
// ========================================

function obterTokenAdmin() {
    return (
        sessionStorage.getItem("admin_token") ||
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("adminToken") ||
        localStorage.getItem("adminToken") ||
        null
    );
}

function headersAdmin() {
    const token = obterTokenAdmin();

    return {
        "Content-Type": "application/json",
        ...(token
            ? { Authorization: `Bearer ${token}` }
            : {})
    };
}

// ========================================
// MENSAGENS
// ========================================

function mostrarMensagem(texto, cor = "#333") {
    if (!mensagem) return;

    mensagem.textContent = texto;
    mensagem.style.color = cor;
}

// ========================================
// BOTÃO PRINCIPAL
// ========================================

function atualizarBotaoFormulario() {
    const botao = form.querySelector('[type="submit"]');

    if (!botao) return;

    botao.textContent = imovelEmEdicao
        ? "Salvar alterações"
        : "Cadastrar imóvel";
}

// ========================================
// CRIAR MAPA
// ========================================

function iniciarMapa() {
    const elementoMapa = document.getElementById("mapaCadastro");

    if (!elementoMapa) {
        console.error("Elemento #mapaCadastro não encontrado.");
        return;
    }

    if (typeof L === "undefined") {
        console.error("Leaflet não foi carregado.");

        elementoMapa.innerHTML = `
            <div class="erro-mapa">
                Não foi possível carregar o mapa.
            </div>
        `;

        return;
    }

    mapa = L.map("mapaCadastro").setView(
        [-22.9056, -47.0608],
        13
    );

    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(mapa);

    mapa.on("click", function (event) {
        definirLocalizacao(
            event.latlng.lat,
            event.latlng.lng,
            false
        );
    });

    setTimeout(() => {
        mapa.invalidateSize();
    }, 200);
}

// ========================================
// DEFINIR LOCALIZAÇÃO
// ========================================

function definirLocalizacao(latitude, longitude, centralizar = true) {
    latitudeSelecionada = Number(latitude);
    longitudeSelecionada = Number(longitude);

    if (!mapa) return;

    const posicao = [
        latitudeSelecionada,
        longitudeSelecionada
    ];

    if (marcador) {
        marcador.setLatLng(posicao);
    } else {
        marcador = L.marker(posicao).addTo(mapa);
    }

    marcador
        .bindPopup("Localização do imóvel")
        .openPopup();

    if (centralizar) {
        mapa.setView(posicao, 15);
    }

    if (textoLocalizacao) {
        textoLocalizacao.textContent =
            "Localização selecionada ✓";

        textoLocalizacao.classList.add("selecionada");
    }
}

// ========================================
// LIMPAR LOCALIZAÇÃO
// ========================================

function limparLocalizacao() {
    latitudeSelecionada = null;
    longitudeSelecionada = null;

    if (textoLocalizacao) {
        textoLocalizacao.textContent =
            "Nenhuma localização selecionada";

        textoLocalizacao.classList.remove("selecionada");
    }

    if (marcador && mapa) {
        mapa.removeLayer(marcador);
        marcador = null;
    }

    if (mapa) {
        mapa.setView([-22.9056, -47.0608], 13);
    }
}

// ========================================
// LIMPAR FORMULÁRIO
// ========================================

function limparFormulario() {
    form.reset();

    imovelEmEdicao = null;

    limparLocalizacao();
    atualizarBotaoFormulario();
}

// ========================================
// OBTER DADOS DO FORMULÁRIO
// ========================================

function obterDadosFormulario() {
    const valor = (id) => {
        return document.getElementById(id)?.value ?? "";
    };

    const imagem = valor("imagens").trim();

    return {
        titulo: valor("titulo"),
        tipo: valor("tipo"),
        finalidade: valor("finalidade"),
        preco: Number(valor("preco")),
        cidade: valor("cidade"),
        bairro: valor("bairro"),
        endereco: valor("endereco"),

        latitude: latitudeSelecionada,
        longitude: longitudeSelecionada,

        area: Number(valor("area")),
        quartos: Number(valor("quartos")),
        banheiros: Number(valor("banheiros")),
        vagas: Number(valor("vagas")),

        descricao: valor("descricao"),

        imagens: imagem ? [imagem] : [],

        destaque: document.getElementById("destaque")?.checked ?? false
    };
}

// ========================================
// CADASTRAR OU EDITAR
// ========================================

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (
        latitudeSelecionada === null ||
        longitudeSelecionada === null
    ) {
        mostrarMensagem(
            "Clique no mapa para marcar a localização do imóvel.",
            "red"
        );
        return;
    }

    const dadosImovel = obterDadosFormulario();

    const editando = Boolean(imovelEmEdicao);

    const url = editando
        ? `${API}/${imovelEmEdicao}`
        : API;

    const metodo = editando ? "PUT" : "POST";

    const botao = form.querySelector('[type="submit"]');

    try {
        mostrarMensagem(
            editando
                ? "Salvando alterações..."
                : "Cadastrando imóvel..."
        );

        if (botao) botao.disabled = true;

        const resposta = await fetch(url, {
            method: metodo,
            headers: headersAdmin(),
            body: JSON.stringify(dadosImovel)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível salvar o imóvel."
            );
        }

        limparFormulario();

        mostrarMensagem(
            editando
                ? "Imóvel atualizado com sucesso!"
                : "Imóvel cadastrado com sucesso!",
            "green"
        );

        await carregarImoveis();

    } catch (error) {
        console.error("Erro ao salvar imóvel:", error);

        mostrarMensagem(error.message, "red");

    } finally {
        if (botao) botao.disabled = false;
    }
});

// ========================================
// CARREGAR IMÓVEIS
// ========================================

async function carregarImoveis() {
    try {
        const resposta = await fetch(API);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar imóveis");
        }

        const imoveis = await resposta.json();

        lista.innerHTML = "";

        if (!Array.isArray(imoveis) || imoveis.length === 0) {
            lista.innerHTML = `
                <p>Nenhum imóvel cadastrado.</p>
            `;
            return;
        }

        imoveis.forEach(function (imovel) {
            const elemento = document.createElement("div");

            elemento.className = "imovel";

            const preco = Number(
                imovel.preco || 0
            ).toLocaleString("pt-BR");

            const info = document.createElement("div");
            info.className = "imovel-info";

            const titulo = document.createElement("h3");
            titulo.textContent = imovel.titulo || "Sem título";

            const endereco = document.createElement("p");
            endereco.textContent =
                `${imovel.bairro || ""} - ${imovel.cidade || ""}`;

            const valor = document.createElement("p");
            valor.textContent = `R$ ${preco}`;

            const tipo = document.createElement("p");
            tipo.textContent =
                `${imovel.tipo || ""} - ${imovel.finalidade || ""}`;

            const localizacao = document.createElement("p");

            const temLocalizacao =
                imovel.latitude != null &&
                imovel.longitude != null;

            localizacao.className = temLocalizacao
                ? "localizacao-cadastrada"
                : "localizacao-nao-cadastrada";

            localizacao.textContent = temLocalizacao
                ? "📍 Localização cadastrada"
                : "Localização não cadastrada";

            info.append(
                titulo,
                endereco,
                valor,
                tipo,
                localizacao
            );

            // BOTÃO EDITAR
            const botaoEditar = document.createElement("button");

            botaoEditar.type = "button";
            botaoEditar.className = "btn-editar";
            botaoEditar.textContent = "Editar";

            botaoEditar.addEventListener("click", () => {
                editarImovel(imovel._id);
            });

            // BOTÃO EXCLUIR
            const botaoExcluir = document.createElement("button");

            botaoExcluir.type = "button";
            botaoExcluir.className = "btn-excluir";
            botaoExcluir.textContent = "Excluir";

            botaoExcluir.addEventListener("click", () => {
                excluirImovel(imovel._id);
            });

            const acoes = document.createElement("div");
            acoes.className = "acoes-imovel";

            acoes.append(botaoEditar, botaoExcluir);

            elemento.append(info, acoes);

            lista.appendChild(elemento);
        });

    } catch (error) {
        console.error("Erro ao carregar imóveis:", error);

        lista.innerHTML = `
            <p>Erro ao carregar imóveis.</p>
        `;
    }
}

// ========================================
// EDITAR IMÓVEL
// ========================================

async function editarImovel(id) {
    try {
        const resposta = await fetch(`${API}/${id}`);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar imóvel");
        }

        const imovel = await resposta.json();

        imovelEmEdicao = id;

        const campos = [
            "titulo",
            "tipo",
            "finalidade",
            "preco",
            "cidade",
            "bairro",
            "endereco",
            "area",
            "quartos",
            "banheiros",
            "vagas",
            "descricao"
        ];

        campos.forEach((campo) => {
            const elemento = document.getElementById(campo);

            if (elemento) {
                elemento.value = imovel[campo] ?? "";
            }
        });

        const campoImagens = document.getElementById("imagens");

        if (campoImagens) {
            campoImagens.value = imovel.imagens?.[0] || "";
        }

        const campoDestaque = document.getElementById("destaque");

        if (campoDestaque) {
            campoDestaque.checked = Boolean(imovel.destaque);
        }

        // LOCALIZAÇÃO
        limparLocalizacao();

        if (
            imovel.latitude != null &&
            imovel.longitude != null
        ) {
            definirLocalizacao(
                imovel.latitude,
                imovel.longitude
            );
        }

        atualizarBotaoFormulario();

        mostrarMensagem(
            "Editando imóvel. Altere os campos e clique em Salvar alterações.",
            "#333"
        );

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        setTimeout(() => {
            if (mapa) mapa.invalidateSize();
        }, 400);

    } catch (error) {
        console.error("Erro ao editar imóvel:", error);

        alert("Não foi possível carregar o imóvel para edição.");
    }
}

// ========================================
// EXCLUIR IMÓVEL
// ========================================

async function excluirImovel(id) {
    const confirmar = confirm(
        "Tem certeza que deseja excluir este imóvel?"
    );

    if (!confirmar) return;

    try {
        const resposta = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: headersAdmin()
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Erro ao excluir imóvel."
            );
        }

        if (imovelEmEdicao === id) {
            limparFormulario();
        }

        mostrarMensagem(
            "Imóvel excluído com sucesso!",
            "green"
        );

        await carregarImoveis();

    } catch (error) {
        console.error("Erro ao excluir imóvel:", error);

        alert(error.message);
    }
}

// ========================================
// INICIAR
// ========================================

iniciarMapa();
atualizarBotaoFormulario();
carregarImoveis();
