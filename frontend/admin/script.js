
const API = "https://tcc-3-nnmd.onrender.com/api/imoveis";
const API_ADMIN = "https://tcc-3-nnmd.onrender.com/api/admin";

const form = document.getElementById("formImovel");
const lista = document.getElementById("listaImoveis");
const mensagem = document.getElementById("mensagem");
const textoLocalizacao = document.getElementById("textoLocalizacao");

let latitudeSelecionada = null;
let longitudeSelecionada = null;
let marcador = null;
let mapa = null;
let imovelEmEdicao = null;

function tokenAdmin() {
    return window.AdminAuth?.token() || "";
}

// ========================================
// MAPA DE CADASTRO
// ========================================

function iniciarMapa() {
    const elementoMapa = document.getElementById("mapaCadastro");

    if (!elementoMapa) {
        console.error("Elemento #mapaCadastro não encontrado.");
        return;
    }

    if (typeof L === "undefined") {
        elementoMapa.textContent = "Não foi possível carregar o mapa.";
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
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
    ).addTo(mapa);

    mapa.on("click", event => {
        latitudeSelecionada = event.latlng.lat;
        longitudeSelecionada = event.latlng.lng;

        if (marcador) {
            marcador.setLatLng(event.latlng);
        } else {
            marcador = L.marker(event.latlng).addTo(mapa);
        }

        marcador
            .bindPopup("Localização do imóvel")
            .openPopup();

        textoLocalizacao.textContent = "Localização selecionada ✓";
        textoLocalizacao.classList.add("selecionada");
    });

    setTimeout(() => mapa.invalidateSize(), 200);
}

// ========================================
// CADASTRAR OU EDITAR IMÓVEL
// ========================================

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (
        latitudeSelecionada === null ||
        longitudeSelecionada === null
    ) {
        mensagem.textContent =
            "Clique no mapa para marcar a localização do imóvel.";
        mensagem.style.color = "red";
        return;
    }

    const imagem = document.getElementById("imagens").value.trim();

    const imovel = {
        titulo: document.getElementById("titulo").value,
        tipo: document.getElementById("tipo").value,
        finalidade: document.getElementById("finalidade").value,
        preco: Number(document.getElementById("preco").value),
        cidade: document.getElementById("cidade").value,
        bairro: document.getElementById("bairro").value,
        endereco: document.getElementById("endereco").value,
        latitude: latitudeSelecionada,
        longitude: longitudeSelecionada,
        area: Number(document.getElementById("area").value),
        quartos: Number(document.getElementById("quartos").value),
        banheiros: Number(document.getElementById("banheiros").value),
        vagas: Number(document.getElementById("vagas").value),
        descricao: document.getElementById("descricao").value,
        imagens: imagem ? [imagem] : [],
        caracteristicas: [],
        destaque: document.getElementById("destaque").checked,
        lancamento: false
    };

    if (imovelEmEdicao) {
        delete imovel.caracteristicas;
        delete imovel.lancamento;
    }

    try {
        mensagem.textContent = imovelEmEdicao
            ? "Salvando alterações..."
            : "Cadastrando imóvel...";
        mensagem.style.color = "#333";

        const resposta = await fetch(
            imovelEmEdicao ? `${API}/${imovelEmEdicao}` : API,
            {
                method: imovelEmEdicao ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenAdmin()}`
                },
                body: JSON.stringify(imovel)
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao salvar imóvel.");
        }

        mensagem.textContent = imovelEmEdicao
            ? "Imóvel atualizado com sucesso!"
            : "Imóvel cadastrado com sucesso!";
        mensagem.style.color = "green";

        imovelEmEdicao = null;

        const botao = form.querySelector('[type="submit"]');
        if (botao) botao.textContent = "Cadastrar imóvel";

        form.reset();

        latitudeSelecionada = null;
        longitudeSelecionada = null;

        textoLocalizacao.textContent =
            "Nenhuma localização selecionada";
        textoLocalizacao.classList.remove("selecionada");

        if (marcador && mapa) {
            mapa.removeLayer(marcador);
            marcador = null;
        }

        if (mapa) {
            mapa.setView([-22.9056, -47.0608], 13);
        }

        await carregarImoveis();

    } catch (erro) {
        console.error("Erro ao salvar imóvel:", erro);
        mensagem.textContent = erro.message;
        mensagem.style.color = "red";
    }
});

// ========================================
// LISTAR IMÓVEIS
// ========================================

async function carregarImoveis() {
    try {
        const resposta = await fetch(API);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar imóveis.");
        }

        const imoveis = await resposta.json();
        lista.replaceChildren();

        if (!Array.isArray(imoveis) || imoveis.length === 0) {
            lista.textContent = "Nenhum imóvel cadastrado.";
            return;
        }

        imoveis.forEach(imovel => {
            const elemento = document.createElement("div");
            elemento.className = "imovel";

            const informacoes = document.createElement("div");
            informacoes.className = "imovel-info";

            const titulo = document.createElement("h3");
            titulo.textContent = imovel.titulo || "Sem título";

            const endereco = document.createElement("p");
            endereco.textContent =
                `${imovel.bairro || ""} - ${imovel.cidade || ""}`;

            const preco = document.createElement("p");
            preco.textContent =
                "R$ " + Number(imovel.preco || 0).toLocaleString("pt-BR");

            const tipo = document.createElement("p");
            tipo.textContent =
                `${imovel.tipo || ""} - ${imovel.finalidade || ""}`;

            const localizacao = document.createElement("p");

            const possuiLocalizacao =
                imovel.latitude != null &&
                imovel.longitude != null;

            localizacao.className = possuiLocalizacao
                ? "localizacao-cadastrada"
                : "localizacao-nao-cadastrada";

            localizacao.textContent = possuiLocalizacao
                ? "📍 Localização cadastrada"
                : "Localização não cadastrada";

            informacoes.append(
                titulo,
                endereco,
                preco,
                tipo,
                localizacao
            );

            const acoes = document.createElement("div");
            acoes.className = "acoes-imovel";

            const editar = document.createElement("button");
            editar.type = "button";
            editar.className = "btn-editar";
            editar.textContent = "Editar";
            editar.addEventListener("click", () => {
                editarImovel(imovel._id);
            });

            const excluir = document.createElement("button");
            excluir.type = "button";
            excluir.className = "btn-excluir";
            excluir.textContent = "Excluir";
            excluir.addEventListener("click", () => {
                excluirImovel(imovel._id);
            });

            acoes.append(editar, excluir);
            elemento.append(informacoes, acoes);
            lista.appendChild(elemento);
        });

    } catch (erro) {
        console.error("Erro ao carregar imóveis:", erro);
        lista.textContent = "Erro ao carregar imóveis.";
    }
}

// ========================================
// EDITAR IMÓVEL
// ========================================

async function editarImovel(id) {
    try {
        const resposta = await fetch(`${API}/${id}`);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar imóvel.");
        }

        const imovel = await resposta.json();

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

        campos.forEach(nome => {
            const campo = document.getElementById(nome);

            if (campo) {
                campo.value = imovel[nome] ?? "";
            }
        });

        document.getElementById("imagens").value =
            imovel.imagens?.[0] || "";

        document.getElementById("destaque").checked =
            Boolean(imovel.destaque);

        latitudeSelecionada = imovel.latitude ?? null;
        longitudeSelecionada = imovel.longitude ?? null;

        if (marcador && mapa) {
            mapa.removeLayer(marcador);
            marcador = null;
        }

        if (
            latitudeSelecionada !== null &&
            longitudeSelecionada !== null &&
            mapa
        ) {
            const posicao = [
                Number(latitudeSelecionada),
                Number(longitudeSelecionada)
            ];

            marcador = L.marker(posicao).addTo(mapa);
            marcador.bindPopup("Localização do imóvel");
            mapa.setView(posicao, 15);

            textoLocalizacao.textContent =
                "Localização selecionada ✓";
            textoLocalizacao.classList.add("selecionada");
        } else {
            textoLocalizacao.textContent =
                "Nenhuma localização selecionada";
            textoLocalizacao.classList.remove("selecionada");
        }

        imovelEmEdicao = id;

        const botao = form.querySelector('[type="submit"]');
        if (botao) botao.textContent = "Salvar alterações";

        mensagem.textContent =
            "Editando imóvel. Altere os campos e salve.";
        mensagem.style.color = "#333";

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        if (mapa) {
            setTimeout(() => mapa.invalidateSize(), 350);
        }

    } catch (erro) {
        console.error("Erro ao editar imóvel:", erro);
        alert("Não foi possível carregar o imóvel para edição.");
    }
}

// ========================================
// EXCLUIR IMÓVEL
// ========================================

async function excluirImovel(id) {
    if (!confirm("Tem certeza que deseja excluir este imóvel?")) {
        return;
    }

    try {
        const resposta = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${tokenAdmin()}`
            }
        });

        if (!resposta.ok) {
            throw new Error("Erro ao excluir imóvel.");
        }

        await carregarImoveis();

    } catch (erro) {
        console.error("Erro ao excluir imóvel:", erro);
        alert("Não foi possível excluir o imóvel.");
    }
}

// ========================================
// GERENCIAMENTO DE AGENDAMENTOS
// ========================================

const listaVisitas = document.getElementById(
    "listaAgendamentosAdmin"
);

const mensagemVisitas = document.getElementById(
    "mensagemAgendamentos"
);

const filtroVisitas = document.getElementById(
    "filtroStatusAgendamento"
);

const botaoAtualizarVisitas = document.getElementById(
    "atualizarAgendamentos"
);

let agendamentos = [];
let carregandoVisitas = false;

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function criarElemento(tag, classe = "", texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = String(texto);
    }

    return elemento;
}

function adicionarInformacao(container, rotulo, valor) {
    const linha = criarElemento(
        "p",
        "agendamento-informacao"
    );

    const destaque = criarElemento(
        "strong",
        "",
        `${rotulo}: `
    );

    linha.append(
        destaque,
        document.createTextNode(String(valor ?? "-"))
    );

    container.appendChild(linha);
}

function formatarDataVisita(data) {
    const partes = String(data || "").split("-");

    if (partes.length !== 3) {
        return String(data || "-");
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function nomeStatus(status) {
    const nomes = {
        pendente: "Pendente",
        confirmado: "Confirmado",
        recusado: "Recusado",
        cancelado: "Cancelado"
    };

    return nomes[status] || status;
}

// ========================================
// EXIBIR SOLICITAÇÕES
// ========================================

function renderizarAgendamentos() {
    if (!listaVisitas || !filtroVisitas) return;

    listaVisitas.replaceChildren();

    const statusSelecionado = filtroVisitas.value;

    const filtrados = agendamentos
        .filter(item => {
            return (
                statusSelecionado === "todos" ||
                item.status === statusSelecionado
            );
        })
        .sort((a, b) => {
            const pendenteA = a.status === "pendente" ? 1 : 0;
            const pendenteB = b.status === "pendente" ? 1 : 0;

            return (
                pendenteB - pendenteA ||
                new Date(b.createdAt) - new Date(a.createdAt)
            );
        });

    if (filtrados.length === 0) {
        listaVisitas.appendChild(
            criarElemento(
                "p",
                "agendamentos-vazio",
                "Nenhuma solicitação encontrada."
            )
        );
        return;
    }

    filtrados.forEach(item => {
        const card = criarElemento(
            "article",
            "agendamento-admin-card"
        );

        const topo = criarElemento(
            "div",
            "agendamento-admin-topo"
        );

        const titulo = criarElemento(
            "h3",
            "",
            item.imovel?.titulo || "Imóvel não encontrado"
        );

        const status = criarElemento(
            "span",
            `agendamento-status status-${item.status}`,
            nomeStatus(item.status)
        );

        topo.append(titulo, status);
        card.appendChild(topo);

        const detalhes = criarElemento(
            "div",
            "agendamento-admin-informacoes"
        );

        adicionarInformacao(
            detalhes,
            "Cliente",
            item.usuario?.nome || "Usuário não encontrado"
        );

        adicionarInformacao(
            detalhes,
            "E-mail",
            item.usuario?.email || "-"
        );

        adicionarInformacao(
            detalhes,
            "Telefone",
            item.telefone
        );

        adicionarInformacao(
            detalhes,
            "Data",
            formatarDataVisita(item.data)
        );

        adicionarInformacao(
            detalhes,
            "Horário",
            item.horario
        );

        adicionarInformacao(
            detalhes,
            "Local",
            [
                item.imovel?.bairro,
                item.imovel?.cidade
            ].filter(Boolean).join(" - ") || "-"
        );

        card.appendChild(detalhes);

        if (item.status === "pendente") {
            const acoes = criarElemento(
                "div",
                "agendamento-admin-acoes"
            );

            const aceitar = criarElemento(
                "button",
                "btn-aceitar-visita",
                "Aceitar visita"
            );

            aceitar.type = "button";

            aceitar.addEventListener("click", () => {
                atualizarStatusVisita(
                    item._id,
                    "confirmado"
                );
            });

            const rejeitar = criarElemento(
                "button",
                "btn-rejeitar-visita",
                "Rejeitar visita"
            );

            rejeitar.type = "button";

            rejeitar.addEventListener("click", () => {
                atualizarStatusVisita(
                    item._id,
                    "recusado"
                );
            });

            acoes.append(aceitar, rejeitar);
            card.appendChild(acoes);
        }

        listaVisitas.appendChild(card);
    });
}

// ========================================
// CONSULTAR SOLICITAÇÕES
// ========================================

async function carregarAgendamentos() {
    if (
        carregandoVisitas ||
        !tokenAdmin() ||
        document.getElementById("adminPainel")?.hidden
    ) {
        return;
    }

    carregandoVisitas = true;

    if (botaoAtualizarVisitas) {
        botaoAtualizarVisitas.disabled = true;
    }

    mensagemVisitas.textContent =
        "Carregando solicitações...";

    try {
        const resposta = await fetch(
            `${API_ADMIN}/agendamentos`,
            {
                headers: {
                    Authorization: `Bearer ${tokenAdmin()}`
                },
                cache: "no-store"
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Erro ao consultar visitas."
            );
        }

        if (!Array.isArray(dados)) {
            throw new Error(
                "Lista de agendamentos inválida."
            );
        }

        agendamentos = dados;

        renderizarAgendamentos();

        mensagemVisitas.textContent =
            `${dados.length} solicitação(ões) encontrada(s).`;

    } catch (erro) {
        console.error("Erro ao carregar agendamentos:", erro);

        mensagemVisitas.textContent = erro.message;

        listaVisitas.replaceChildren();
    } finally {
        carregandoVisitas = false;

        if (botaoAtualizarVisitas) {
            botaoAtualizarVisitas.disabled = false;
        }
    }
}

// ========================================
// ACEITAR OU REJEITAR VISITA
// ========================================

async function atualizarStatusVisita(id, novoStatus) {
    const acao = novoStatus === "confirmado"
        ? "aceitar"
        : "rejeitar";

    if (!confirm(`Deseja ${acao} esta visita?`)) {
        return;
    }

    listaVisitas.querySelectorAll("button").forEach(botao => {
        botao.disabled = true;
    });

    mensagemVisitas.textContent =
        "Salvando alteração...";

    try {
        const resposta = await fetch(
            `${API_ADMIN}/agendamentos/${encodeURIComponent(id)}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenAdmin()}`
                },
                body: JSON.stringify({
                    status: novoStatus
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Não foi possível atualizar."
            );
        }

        agendamentos = agendamentos.map(item => {
            if (item._id === id) {
                return {
                    ...item,
                    status: novoStatus
                };
            }

            return item;
        });

        renderizarAgendamentos();

        mensagemVisitas.textContent =
            dados.mensagem || "Solicitação atualizada.";

    } catch (erro) {
        console.error("Erro ao atualizar visita:", erro);

        mensagemVisitas.textContent = erro.message;

        renderizarAgendamentos();
        await carregarAgendamentos();
    }
}

// ========================================
// EVENTOS DOS AGENDAMENTOS
// ========================================

filtroVisitas?.addEventListener(
    "change",
    renderizarAgendamentos
);

botaoAtualizarVisitas?.addEventListener(
    "click",
    carregarAgendamentos
);

// ========================================
// INICIAR PAINEL ADMINISTRATIVO
// ========================================

window.addEventListener("admin-autenticado", () => {
    if (!mapa) {
        iniciarMapa();
    }

    carregarImoveis();
    carregarAgendamentos();
});

// Caso o painel já esteja autenticado
if (
    tokenAdmin() &&
    !document.getElementById("adminPainel")?.hidden
) {
    if (!mapa) {
        iniciarMapa();
    }

    carregarImoveis();
    carregarAgendamentos();
}
