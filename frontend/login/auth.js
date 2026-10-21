const AUTH_API = "https://tcc-3-nnmd.onrender.com/api/auth";
const ORIGEM_CATALOGO = "https://tcc-3-frontend.vercel.app";
const parametros = new URLSearchParams(window.location.search);
function destinoSeguro() {
  const recebido = parametros.get("retorno");
  if (!recebido) return `${ORIGEM_CATALOGO}/filter-main/`;
  try {
    const url = new URL(recebido);
    if (url.origin === ORIGEM_CATALOGO && url.protocol === "https:") return url.href;
  } catch {}
  return `${ORIGEM_CATALOGO}/filter-main/`;
}

async function requisitar(rota, dados) {
  const resposta = await fetch(`${AUTH_API}/${rota}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });
  let corpo = {};
  try { corpo = await resposta.json(); } catch {}
  if (!resposta.ok) throw new Error(corpo.erro || "Não foi possível completar a solicitação.");
  return corpo;
}

function status(id, mensagem, erro = false) {
  const el = document.getElementById(id);
  el.textContent = mensagem;
  el.className = `auth-status ${erro ? "erro" : "sucesso"}`;
}

function concluirLogin(dados) {
  // Login e catálogo estão em origens diferentes: sessionStorage não é compartilhado.
  // Encaminha a sessão somente para o domínio fixo e autorizado do catálogo.
  // O catálogo remove o fragmento da URL imediatamente ao recebê-lo.
  if (!dados.token) throw new Error("O servidor não retornou a sessão.");
  const url = new URL(destinoSeguro());
  url.hash = `hangar_auth=${encodeURIComponent(dados.token)}`;
  window.location.replace(url.href);
}

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const botao = e.currentTarget.querySelector('button[type="submit"]');
  botao.disabled = true;
  status("login-status", "Entrando...");
  try {
    const dados = await requisitar("login", {
      email: document.getElementById("login-email").value,
      senha: document.getElementById("login-senha").value
    });
    concluirLogin(dados);
  } catch (erro) {
    status("login-status", erro.message, true);
  } finally { botao.disabled = false; }
});

document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const senha = document.getElementById("cadastro-senha").value;
  if (senha !== document.getElementById("cadastro-confirmar").value) {
    status("cadastro-status", "As senhas não coincidem.", true);
    return;
  }
  const botao = e.currentTarget.querySelector('button[type="submit"]');
  botao.disabled = true;
  status("cadastro-status", "Criando conta...");
  try {
    const dados = await requisitar("cadastro", {
      nome: document.getElementById("cadastro-nome").value,
      email: document.getElementById("cadastro-email").value,
      senha
    });
    concluirLogin(dados);
  } catch (erro) {
    status("cadastro-status", erro.message, true);
  } finally { botao.disabled = false; }
});
