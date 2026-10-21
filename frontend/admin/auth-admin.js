const ADMIN_API = "https://tcc-3-nnmd.onrender.com/api/admin";
const ADMIN_TOKEN_KEY = "hangar_admin_token";
window.AdminAuth = { token: () => sessionStorage.getItem(ADMIN_TOKEN_KEY) || "" };
const loginBox = document.getElementById("adminLogin");
const painel = document.getElementById("adminPainel");
const erro = document.getElementById("adminLoginErro");
const formulario = document.getElementById("adminLoginForm");
function exibirLogin() { painel.hidden = true; loginBox.hidden = false; }
function exibirPainel() { loginBox.hidden = true; painel.hidden = false; window.dispatchEvent(new Event("admin-autenticado")); }
async function validarSessao() {
  const token = window.AdminAuth.token();
  if (!token) return exibirLogin();
  try {
    const r = await fetch(`${ADMIN_API}/verificar`, {headers: {Authorization: `Bearer ${token}`}});
    if (!r.ok) throw Error("Sessão inválida");
    exibirPainel();
  } catch { sessionStorage.removeItem(ADMIN_TOKEN_KEY); exibirLogin(); }
}
formulario.addEventListener("submit", async e => {
  e.preventDefault(); erro.textContent = "";
  const botao = document.getElementById("adminEntrar"); botao.disabled = true;
  try {
    const r = await fetch(`${ADMIN_API}/login`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({usuario:document.getElementById("adminUsuario").value.trim(),senha:document.getElementById("adminSenha").value})});
    const data = await r.json().catch(()=>({}));
    if (!r.ok || !data.token) throw Error(data.erro || "Usuário ou senha inválidos.");
    sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    formulario.reset(); exibirPainel();
  } catch(e) { erro.textContent = e.message || "Falha ao entrar."; }
  finally { botao.disabled = false; }
});
document.getElementById("adminSair").addEventListener("click", () => {sessionStorage.removeItem(ADMIN_TOKEN_KEY); exibirLogin();});
validarSessao();
