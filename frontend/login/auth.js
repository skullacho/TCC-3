const AUTH_API = "https://tcc-3-nnmd.onrender.com/api/auth";
const DESTINO_APOS_LOGIN = "https://tcc-3-frontend.vercel.app/";

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
  // Sessão da aba atual; a API deve validar o token em todas as operações protegidas.
  sessionStorage.setItem("hangar_token", dados.token);
  sessionStorage.setItem("hangar_usuario", JSON.stringify(dados.usuario));
  window.location.assign(DESTINO_APOS_LOGIN);
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
