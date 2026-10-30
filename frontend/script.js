
document.addEventListener("DOMContentLoaded", () => {
    const API = "https://tcc-3-nnmd.onrender.com/api/imoveis";
    const API_AGENDA = "https://tcc-3-nnmd.onrender.com/api/agendamentos";
    const LOGIN_URL = "https://tcc-3-login.vercel.app/";
    const PENDENTE_KEY = "hangar_imovel_agendar";

    const container = document.querySelector(".cards-container");
    const contador = document.getElementById("contador");
    const btnFiltrar = document.querySelector(".btn-filtrar");
    const selectOrdenar = document.getElementById("ordenar");

    const modalAgenda = document.getElementById("modal-agendamento");
    const formAgenda = document.getElementById("form-agendamento");
    const mensagemAgenda = document.getElementById("agenda-mensagem");
    const listaAgenda = document.getElementById("lista-agendamentos");

    let todosImoveis = [];
    let imoveisExibidos = [];
    let imovelEscolhido = null;
    let horarioEscolhido = null;

    const token = () => sessionStorage.getItem("hangar_token");

    // ========================================
    // RECEBER LOGIN
    // ========================================

    const retornoAuth = new URLSearchParams(location.hash.slice(1));

    if (retornoAuth.has("hangar_auth")) {
        const recebido = retornoAuth.get("hangar_auth");

        if (recebido) {
            sessionStorage.setItem("hangar_token", recebido);
        }

        history.replaceState(
            null,
            "",
            location.pathname + location.search
        );
    }

    function irParaLogin(imovelId = null) {
        if (imovelId) {
            sessionStorage.setItem(PENDENTE_KEY, String(imovelId));
        }

        const destino = new URL(LOGIN_URL);

        destino.searchParams.set(
            "retorno",
            location.origin + location.pathname + location.search
        );

        location.assign(destino.toString());
    }

    // ========================================
    // MENU MOBILE
    // ========================================

    window.toggleMenu = function () {
        document.getElementById("nav-container")
            ?.classList.toggle("active");
    };

    // ========================================
    // NORMALIZAR TEXTO
    // ========================================

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");
    }

    // ========================================
    // AGENDAMENTO
    // ========================================

    function abrirAgenda(imovel) {
        if (!token()) {
            irParaLogin(imovel._id);
            return;
        }

        imovelEscolhido = imovel;
        horarioEscolhido = null;

        document.querySelectorAll(".agenda-horarios button")
            .forEach(botao => {
                botao.classList.remove("selecionado");
            });

        document.getElementById("agenda-imovel").textContent =
            imovel.titulo || "Imóvel";

        mensagemAgenda.textContent = "";
        formAgenda.reset();

        modalAgenda.hidden = false;
        document.getElementById("agenda-data").focus();
    }

    document.getElementById("fechar-agendamento")
        .addEventListener("click", () => {
            modalAgenda.hidden = true;
        });

    modalAgenda.addEventListener("click", event => {
        if (event.target === modalAgenda) {
            modalAgenda.hidden = true;
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            modalAgenda.hidden = true;
        }
    });

    document.querySelectorAll(".agenda-horarios button")
        .forEach(botao => {
            botao.addEventListener("click", () => {
                horarioEscolhido = botao.dataset.hora;

                document.querySelectorAll(".agenda-horarios button")
                    .forEach(item => {
                        item.classList.toggle(
                            "selecionado",
                            item === botao
                        );
                    });
            });
        });

    const diaSP = () => {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());
    };

    document.getElementById("agenda-data").min = diaSP();

    formAgenda.addEventListener("submit", async event => {
        event.preventDefault();

        if (!horarioEscolhido) {
            mensagemAgenda.textContent = "Escolha um horário.";
            return;
        }

        const botao = formAgenda.querySelector(
            'button[type="submit"]'
        );

        botao.disabled = true;
        mensagemAgenda.textContent = "Registrando solicitação...";

        try {
            const resposta = await fetch(API_AGENDA, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token()}`
                },
                body: JSON.stringify({
                    imovelId: imovelEscolhido._id,
                    data: document.getElementById("agenda-data").value,
                    horario: horarioEscolhido,
                    telefone: document.getElementById("agenda-telefone").value
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Falha ao solicitar visita."
                );
            }

            mensagemAgenda.textContent =
                dados.mensagem || "Visita solicitada com sucesso!";

            await carregarMeusAgendamentos();

            formAgenda.reset();
            horarioEscolhido = null;

            document.querySelectorAll(".agenda-horarios button")
                .forEach(item => {
                    item.classList.remove("selecionado");
                });

        } catch (erro) {
            mensagemAgenda.textContent = erro.message;

            if (/sessão|login/i.test(erro.message)) {
                sessionStorage.removeItem("hangar_token");
            }
        } finally {
            botao.disabled = false;
        }
    });

    // ========================================
    // MINHAS VISITAS
    // ========================================

    async function carregarMeusAgendamentos() {
        if (!token()) {
            listaAgenda.textContent =
                "Entre na sua conta para consultar suas visitas.";
            return;
        }

        listaAgenda.textContent = "Carregando...";

        try {
            const resposta = await fetch(`${API_AGENDA}/meus`, {
                headers: {
                    Authorization: `Bearer ${token()}`
                }
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Erro ao consultar visitas."
                );
            }

            listaAgenda.replaceChildren();

            if (!dados.length) {
                listaAgenda.textContent =
                    "Você ainda não solicitou visitas.";
                return;
            }

            dados.forEach(item => {
                const linha = document.createElement("div");
                linha.className = "agenda-item";

                const titulo = document.createElement("strong");
                titulo.textContent =
                    item.imovel?.titulo || "Imóvel indisponível";

                const descricao = document.createElement("span");
                descricao.textContent =
                    `${item.data.split("-").reverse().join("/")} ` +
                    `às ${item.horario} • ${item.status}`;

                linha.append(titulo, descricao);

                if (item.status === "pendente") {
                    const cancelar = document.createElement("button");

                    cancelar.className = "agenda-cancelar";
                    cancelar.type = "button";
                    cancelar.textContent = "Cancelar";
                    cancelar.style.marginLeft = "12px";

                    cancelar.addEventListener("click", async () => {
                        if (!confirm("Cancelar esta solicitação?")) {
                            return;
                        }

                        try {
                            const respostaCancelar = await fetch(
                                `${API_AGENDA}/${item._id}/cancelar`,
                                {
                                    method: "PATCH",
                                    headers: {
                                        Authorization: `Bearer ${token()}`
                                    }
                                }
                            );

                            if (!respostaCancelar.ok) {
                                const erro = await respostaCancelar.json();

                                throw new Error(
                                    erro.erro || "Erro ao cancelar."
                                );
                            }

                            await carregarMeusAgendamentos();

                        } catch (erro) {
                            alert(erro.message);
                        }
                    });

                    linha.appendChild(cancelar);
                }

                listaAgenda.appendChild(linha);
            });

        } catch (erro) {
            listaAgenda.textContent = erro.message;
        }
    }

    document.getElementById("btn-meus-agendamentos")
        .addEventListener("click", () => {
            if (!token()) {
                sessionStorage.setItem("hangar_abrir_meus", "1");
                irParaLogin();
                return;
            }

            carregarMeusAgendamentos();
        });

    if (token()) {
        carregarMeusAgendamentos();

        if (sessionStorage.getItem("hangar_abrir_meus") === "1") {
            sessionStorage.removeItem("hangar_abrir_meus");

            requestAnimationFrame(() => {
                document.getElementById("meus-agendamentos")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });
            });
        }
    }

    // ========================================
    // CARREGAR IMÓVEIS
    // ========================================

    async function carregarImoveis() {
        if (!container) return;

        container.innerHTML = `
            <p style="padding:20px">Carregando imóveis...</p>
        `;

        try {
            const resposta = await fetch(API);

            if (!resposta.ok) {
                throw new Error("Erro ao buscar imóveis.");
            }

            const imoveis = await resposta.json();

            if (!Array.isArray(imoveis)) {
                throw new Error("Resposta inválida da API.");
            }

            todosImoveis = imoveis;
            imoveisExibidos = [...imoveis];

            // Retomar agendamento após o login
            const pendenteId = sessionStorage.getItem(PENDENTE_KEY);

            if (pendenteId && token()) {
                const escolhido = imoveis.find(
                    item => String(item._id) === pendenteId
                );

                sessionStorage.removeItem(PENDENTE_KEY);

                if (escolhido) {
                    requestAnimationFrame(() => {
                        abrirAgenda(escolhido);
                    });
                }
            }

            filtrarImoveis();

        } catch (erro) {
            console.error("Erro ao carregar imóveis:", erro);

            container.innerHTML = `
                <p style="padding:20px">
                    Não foi possível carregar os imóveis.
                </p>
            `;

            atualizarContador(0);
        }
    }

    // ========================================
    // CRIAR CARDS
    // ========================================

    function renderizarImoveis(imoveis) {
        if (!container) return;

        container.replaceChildren();

        if (imoveis.length === 0) {
            container.innerHTML = `
                <p style="padding:20px">
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
            card.dataset.finalidade = normalizar(imovel.finalidade);

            // IMAGEM
            const imagem = imovel.imagens?.length
                ? imovel.imagens[0]
                : "https://via.placeholder.com/600x400?text=Sem+imagem";

            const area = imovel.area > 0
                ? `${imovel.area}m²`
                : "-";

            const quartos = imovel.quartos > 0
                ? `${imovel.quartos} quartos`
                : "-";

            const vagas = imovel.vagas > 0
                ? `${imovel.vagas} vagas`
                : "-";

            const banheiros = imovel.banheiros > 0
                ? `${imovel.banheiros} banhos`
                : "-";

            const preco = Number(imovel.preco || 0)
                .toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                });

            // ========================================
            // ETIQUETA DE VENDA OU ALUGUEL
            // ========================================

            const finalidade = normalizar(imovel.finalidade);

            const textoFinalidade =
                finalidade === "venda" ? "VENDA" :
                finalidade === "aluguel" ? "ALUGUEL" :
                "";

            // Mantém a etiqueta original de destaque
            const textoTag = imovel.lancamento
                ? "LANÇAMENTO"
                : imovel.destaque
                    ? "DESTAQUE"
                    : "";

            // ========================================
            // ESTRUTURA DO CARD
            // ========================================

            const areaImagem = document.createElement("div");
            areaImagem.className = "card-image";

            const foto = document.createElement("img");
            foto.src = imagem;
            foto.alt = imovel.titulo || "Imóvel";
            foto.loading = "lazy";

            areaImagem.appendChild(foto);

            if (textoTag) {
                const tag = document.createElement("span");
                tag.className = "tag";
                tag.textContent = textoTag;
                areaImagem.appendChild(tag);
            }

            if (textoFinalidade) {
                const etiqueta = document.createElement("span");

                etiqueta.className =
                    `tag-finalidade finalidade-${finalidade}`;

                etiqueta.textContent = textoFinalidade;

                areaImagem.appendChild(etiqueta);
            }

            const conteudo = document.createElement("div");
            conteudo.className = "card-content";

            const local = document.createElement("h3");
            local.textContent =
                `${imovel.bairro || ""}` +
                `${imovel.cidade ? " | " + imovel.cidade : ""}`;

            const descricao = document.createElement("p");
            descricao.className = "descricao";
            descricao.textContent = imovel.titulo || "Imóvel";

            const valor = document.createElement("p");
            valor.className = "preco";
            valor.textContent = preco;

            conteudo.append(local, descricao, valor);

            const divisor = document.createElement("div");
            divisor.className = "divider";

            const toggle = document.createElement("div");
            toggle.className = "toggle-btn";
            toggle.innerHTML =
                '<i class="fa-solid fa-chevron-down"></i>';

            const extras = document.createElement("div");
            extras.className = "extra-info";

            const informacoes = document.createElement("div");
            informacoes.className = "info";

            [area, quartos, vagas, banheiros].forEach(texto => {
                const span = document.createElement("span");
                span.textContent = texto;
                informacoes.appendChild(span);
            });

            extras.appendChild(informacoes);

            const agendar = document.createElement("button");
            agendar.type = "button";
            agendar.className = "card-agendar";
            agendar.textContent = "Agendar visita";

            agendar.addEventListener("click", event => {
                event.stopPropagation();
                abrirAgenda(imovel);
            });

            toggle.addEventListener("click", event => {
                event.stopPropagation();
                card.classList.toggle("active");
            });

            card.addEventListener("click", () => {
                window.location.href =
                    `../imovel/index.html?id=${encodeURIComponent(imovel._id)}`;
            });

            card.append(
                areaImagem,
                conteudo,
                divisor,
                toggle,
                extras,
                agendar
            );

            container.appendChild(card);
        });

        atualizarContador(imoveis.length);
    }

    // ========================================
    // CONTADOR
    // ========================================

    function atualizarContador(quantidade) {
        if (contador) {
            contador.textContent =
                `${quantidade} ${quantidade === 1
                    ? "imóvel encontrado"
                    : "imóveis encontrados"}`;
        }
    }

    // ========================================
    // FILTRAR IMÓVEIS
    // ========================================

    function filtrarImoveis() {
        const cidade =
            document.getElementById("cidade")?.value || "todos";

        const bairro =
            document.getElementById("bairro")?.value || "todos";

        // NOVO FILTRO DE FINALIDADE
        const finalidade =
            document.getElementById("finalidade")?.value || "todos";

        const precoMin =
            Number(document.getElementById("precoMin")?.value) || 0;

        const precoMaxInput =
            document.getElementById("precoMax")?.value;

        const precoMax = precoMaxInput
            ? Number(precoMaxInput)
            : Infinity;

        const tiposSelecionados = Array.from(
            document.querySelectorAll(".opcoes button.active")
        ).map(botao => normalizar(botao.textContent));

        const filtrados = todosImoveis.filter(imovel => {
            // CIDADE
            if (
                cidade !== "todos" &&
                normalizar(imovel.cidade) !== normalizar(cidade)
            ) {
                return false;
            }

            // BAIRRO
            if (
                bairro !== "todos" &&
                normalizar(imovel.bairro) !== normalizar(bairro)
            ) {
                return false;
            }

            // FINALIDADE: VENDA OU ALUGUEL
            if (
                finalidade !== "todos" &&
                normalizar(imovel.finalidade) !== normalizar(finalidade)
            ) {
                return false;
            }

            // TIPO
            if (
                tiposSelecionados.length > 0 &&
                !tiposSelecionados.includes(normalizar(imovel.tipo))
            ) {
                return false;
            }

            // PREÇO
            const preco = Number(imovel.preco || 0);

            if (preco < precoMin || preco > precoMax) {
                return false;
            }

            return true;
        });

        imoveisExibidos = filtrados;
        aplicarOrdenacao(filtrados);
    }

    // ========================================
    // ORDENAÇÃO
    // ========================================

    function aplicarOrdenacao(imoveis) {
        const ordem =
            selectOrdenar?.value || "Mais relevantes";

        const ordenados = [...imoveis];

        if (ordem === "Menor preço") {
            ordenados.sort(
                (a, b) => Number(a.preco || 0) - Number(b.preco || 0)
            );
        }

        if (ordem === "Maior preço") {
            ordenados.sort(
                (a, b) => Number(b.preco || 0) - Number(a.preco || 0)
            );
        }

        renderizarImoveis(ordenados);
    }

    // ========================================
    // BOTÕES DE TIPO
    // ========================================

    document.querySelectorAll(".opcoes button")
        .forEach(botao => {
            botao.addEventListener("click", () => {
                botao.classList.toggle("active");
            });
        });

    // ========================================
    // EVENTOS DOS FILTROS
    // ========================================

    btnFiltrar?.addEventListener("click", filtrarImoveis);

    document.getElementById("finalidade")
        ?.addEventListener("change", filtrarImoveis);

    selectOrdenar?.addEventListener("change", () => {
        aplicarOrdenacao(imoveisExibidos);
    });

    // ========================================
    // INICIALIZAR
    // ========================================

    carregarImoveis();
});
