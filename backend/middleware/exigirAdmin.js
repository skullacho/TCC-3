import jwt from "jsonwebtoken";
export default function exigirAdmin(req, res, next) {
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization || "")?.[1];
  if (!token || !process.env.JWT_SECRET) return res.status(401).json({erro:"Acesso não autorizado"});
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {algorithms:["HS256"], issuer:"hangar-admin"});
    if (payload.role !== "admin") throw Error("Permissão negada");
    return next();
  } catch { return res.status(403).json({erro:"Sessão administrativa inválida"}); }
}
