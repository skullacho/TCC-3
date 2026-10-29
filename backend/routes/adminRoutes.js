
import { Router } from "express";
import { scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import exigirAdmin from "../middleware/exigirAdmin.js";
import Agendamento from "../models/Agendamento.js";

const router = Router();

// ========================================
// VERIFICAR SENHA DO ADMINISTRADOR
// ========================================

function conferirSenha(senha, hashConfigurado) {
    const partes = String(hashConfigurado || "").split(":");

    if (
        partes.length !== 2 ||
        !/^[0-9a-f]{32}$/i.test(partes[0]) ||
        !/^[0-9a-f]{128}$/i.test(partes[1])
    ) {
        return false;
    }

    const calculado = scryptSync(
        senha,
        Buffer.from(partes[0], "hex"),
        64
    );

    return timingSafeEqual(
        calculado,
        Buffer.from(partes[1], "hex")
    );
}

// ========================================
// LOGIN ADMINISTRATIVO
// POST /api/admin/login
// ========================================

router.post("/login", (req, res) => {
    const { usuario, senha } = req.body || {};

    if (
        typeof usuario !== "string" ||
        typeof senha !== "string" ||
        usuario.length > 80 ||
        senha.length > 256
    ) {
        return res.status(401).json({
            erro: "Credenciais inválidas"
        });
    }

    if (
        !process.env.ADMIN_USER ||
        !process.env.ADMIN_PASSWORD_HASH ||
        !process.env.JWT_SECRET
    ) {
        return res.status(503).json({
            erro: "Administrador não configurado"
        });
    }

    if (
        usuario !== process.env.ADMIN_USER ||
        !conferirSenha(
            senha,
            process.env.ADMIN_PASSWORD_HASH
        )
    ) {
        return res.status(401).json({
            erro: "Usuário ou senha inválidos"
        });
    }

    const token = jwt.sign(
        {
            role: "admin"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "2h",
            issuer: "hangar-admin",
            algorithm: "HS256"
        }
    );

    return res.json({ token });
});

// ========================================
// VERIFICAR AUTENTICAÇÃO
// GET /api/admin/verificar
// ========================================

router.get(
    "/verificar",
    exigirAdmin,
    (_req, res) => {
        return res.json({
            autenticado: true
        });
    }
);

// ========================================
// LISTAR TODOS OS AGENDAMENTOS
// GET /api/admin/agendamentos
// ========================================

router.get(
    "/agendamentos",
    exigirAdmin,
    async (_req, res) => {
        try {
            const agendamentos = await Agendamento.find()
                .populate(
                    "usuario",
                    "nome email"
                )
                .populate(
                    "imovel",
                    "titulo cidade bairro"
                )
                .sort({
                    createdAt: -1
                })
                .lean();

            return res.json(agendamentos);

        } catch (erro) {
            console.error(
                "Erro ao consultar agendamentos:",
                erro
            );

            return res.status(500).json({
                erro: "Não foi possível carregar os agendamentos."
            });
        }
    }
);

// ========================================
// ACEITAR OU REJEITAR AGENDAMENTO
// PATCH /api/admin/agendamentos/:id/status
// ========================================

router.patch(
    "/agendamentos/:id/status",
    exigirAdmin,
    async (req, res) => {
        const { id } = req.params;
        const { status } = req.body || {};

        // Verifica se o ID é válido
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                erro: "Agendamento inválido."
            });
        }

        // Somente permite aceitar ou rejeitar
        if (
            !["confirmado", "recusado"].includes(status)
        ) {
            return res.status(400).json({
                erro: "Status inválido."
            });
        }

        try {
            // Só permite alterar visitas pendentes
            const agendamento =
                await Agendamento.findOneAndUpdate(
                    {
                        _id: id,
                        status: "pendente"
                    },
                    {
                        $set: {
                            status
                        }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                )
                .populate(
                    "usuario",
                    "nome email"
                )
                .populate(
                    "imovel",
                    "titulo cidade bairro"
                );

            if (!agendamento) {
                return res.status(409).json({
                    erro: "A solicitação não está mais pendente. Atualize a lista."
                });
            }

            const mensagem =
                status === "confirmado"
                    ? "Visita confirmada."
                    : "Visita recusada.";

            return res.json({
                mensagem,
                agendamento
            });

        } catch (erro) {
            console.error(
                "Erro ao atualizar agendamento:",
                erro
            );

            return res.status(500).json({
                erro: "Não foi possível atualizar a visita."
            });
        }
    }
);

export default router;
