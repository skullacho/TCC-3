import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const router = Router();
const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const usuarioPublico = (u) => ({ id: u._id, nome: u.nome, email: u.email });
const tokenPara = (u) => jwt.sign({ sub: String(u._id) }, process.env.JWT_SECRET, { expiresIn: "2h" });

router.post("/cadastro", async (req, res) => {
  try {
    const { nome, email, senha } = req.body || {};
    if (typeof nome !== "string" || nome.trim().length < 2 || nome.trim().length > 100 ||
        typeof email !== "string" || !emailValido(email.trim()) ||
        typeof senha !== "string" || senha.length < 8 || senha.length > 128) {
      return res.status(400).json({ erro: "Informe nome, e-mail válido e senha de 8 a 128 caracteres." });
    }
    const emailNormalizado = email.trim().toLowerCase();
    if (await Usuario.exists({ email: emailNormalizado })) {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }
    const senhaHash = await bcrypt.hash(senha, 12);
    const usuario = await Usuario.create({ nome: nome.trim(), email: emailNormalizado, senhaHash });
    return res.status(201).json({ usuario: usuarioPublico(usuario), token: tokenPara(usuario) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    console.error("Falha ao cadastrar usuário:", error.message);
    return res.status(500).json({ erro: "Não foi possível cadastrar agora." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (typeof email !== "string" || typeof senha !== "string") {
      return res.status(400).json({ erro: "Informe e-mail e senha." });
    }
    const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() }).select("+senhaHash");
    if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }
    return res.json({ usuario: usuarioPublico(usuario), token: tokenPara(usuario) });
  } catch (error) {
    console.error("Falha no login:", error.message);
    return res.status(500).json({ erro: "Não foi possível entrar agora." });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ erro: "Faça login para continuar." });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(payload.sub);
    if (!usuario) return res.status(401).json({ erro: "Sessão inválida." });
    return res.json({ usuario: usuarioPublico(usuario) });
  } catch {
    return res.status(401).json({ erro: "Sessão expirada ou inválida." });
  }
});

export default router;
