import { Router } from "express";
import { scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import exigirAdmin from "../middleware/exigirAdmin.js";
const router = Router();
function conferirSenha(senha, hashConfigurado) {
  const partes = String(hashConfigurado || "").split(":");
  if (partes.length !== 2 || !/^[0-9a-f]{32}$/i.test(partes[0]) || !/^[0-9a-f]{128}$/i.test(partes[1])) return false;
  const calculado = scryptSync(senha, Buffer.from(partes[0], "hex"), 64);
  return timingSafeEqual(calculado, Buffer.from(partes[1], "hex"));
}
router.post("/login", (req,res) => {
  const {usuario, senha} = req.body || {};
  if (typeof usuario !== "string" || typeof senha !== "string" || usuario.length > 80 || senha.length > 256) return res.status(401).json({erro:"Credenciais inválidas"});
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) return res.status(503).json({erro:"Administrador não configurado"});
  if (usuario !== process.env.ADMIN_USER || !conferirSenha(senha, process.env.ADMIN_PASSWORD_HASH)) return res.status(401).json({erro:"Usuário ou senha inválidos"});
  const token = jwt.sign({role:"admin"},process.env.JWT_SECRET,{expiresIn:"2h",issuer:"hangar-admin",algorithm:"HS256"});
  return res.json({token});
});
router.get("/verificar", exigirAdmin, (_req,res) => res.json({autenticado:true}));
export default router;
