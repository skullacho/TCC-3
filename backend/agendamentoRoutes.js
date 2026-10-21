import { Router } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";
import Imovel from "../models/Imovel.js";
import Agendamento from "../models/Agendamento.js";
const router = Router();
async function autenticar(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  try {
    if (!token) return res.status(401).json({ erro: "Faça login para agendar uma visita." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!mongoose.isValidObjectId(payload.sub)) throw Error("Token inválido");
    const usuario = await Usuario.findById(payload.sub);
    if (!usuario) throw Error("Usuário não encontrado");
    req.usuario = usuario;
    next();
  } catch { return res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." }); }
}
router.use(autenticar);
router.get("/meus", async (req, res) => {
  try {
    const agendamentos = await Agendamento.find({ usuario: req.usuario._id })
      .populate("imovel", "titulo cidade bairro imagens").sort({ createdAt: -1 });
    res.json(agendamentos);
  } catch { res.status(500).json({ erro: "Erro ao consultar agendamentos." }); }
});
router.post("/", async (req, res) => {
  try {
    const { imovelId, data, horario, telefone } = req.body || {};
    if (!mongoose.isValidObjectId(imovelId) || typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !["09:00", "11:00", "14:00", "16:00"].includes(horario) || typeof telefone !== "string" ||
      telefone.replace(/\D/g, "").length < 10 || telefone.length > 30) {
      return res.status(400).json({ erro: "Confira o imóvel, a data, o horário e o telefone." });
    }
    const [y, m, d] = data.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.toISOString().slice(0, 10) !== data) return res.status(400).json({ erro: "Data inválida." });
    const agoraSP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if (data <= agoraSP) return res.status(400).json({ erro: "Escolha uma data futura." });
    if (!(await Imovel.exists({ _id: imovelId }))) return res.status(404).json({ erro: "Imóvel não encontrado." });
    const agendamento = await Agendamento.create({ usuario: req.usuario._id, imovel: imovelId, data, horario, telefone: telefone.trim() });
    res.status(201).json({ mensagem: "Solicitação de visita registrada! Aguarde a confirmação.", agendamento });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ erro: "Esse horário já foi solicitado para este imóvel. Escolha outro." });
    console.error("Erro ao agendar:", error.message);
    res.status(500).json({ erro: "Não foi possível registrar a visita." });
  }
});
router.patch("/:id/cancelar", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ erro: "Agendamento inválido." });
  try {
    const agendamento = await Agendamento.findOneAndUpdate(
      { _id: req.params.id, usuario: req.usuario._id, status: "pendente" },
      { $set: { status: "cancelado" } }, { new: true });
    if (!agendamento) return res.status(404).json({ erro: "Agendamento pendente não encontrado." });
    res.json({ mensagem: "Agendamento cancelado.", agendamento });
  } catch { res.status(500).json({ erro: "Erro ao cancelar agendamento." }); }
});
export default router;
