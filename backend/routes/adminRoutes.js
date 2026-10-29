
import { Router } from "express";
import { scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import exigirAdmin from "../middleware/exigirAdmin.js";
import Agendamento from "../models/Agendamento.js";

const router = Router();

// ========================================
// AUTENTICAÇÃO ADMINISTRATIVA
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
        { role: "admin" },
        process.env.JWT_SECRET,
        {
            expiresIn: "2h",
            issuer: "hangar-admin",
            algorithm: "HS256"
        }
    );

    return res.json({ token });
});

router.get("/verificar", exigirAdmin, (_req, res) => {
    res.json({ autenticado: true });
});

// ========================================
// LISTAR AGENDAMENTOS
// ========================================

router.get("/agendamentos", exigirAdmin, async (req, res) => {
    try {
        const agendamentos = await Agendamento.find()
            .populate("usuario", "nome email")
            .populate("imovel", "titulo cidade bairro")
            .sort({
                createdAt: -1
            })
            .lean();

        return res.json(agendamentos);

    } catch (erro) {
        console.error("Erro ao listar agendamentos:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar os agendamentos."
        });
    }
});

// ========================================
// ACEITAR OU REJEITAR AGENDAMENTO
// ========================================

router.patch(
    "/agendamentos/:id/status",
    exigirAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body || {};

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    erro: "Identificador inválido."
                });
            }

            if (!["confirmado", "recusado"].includes(status)) {
                return res.status(400).json({
                    erro: "Status inválido."
                });
            }

            // Só é possível responder a uma solicitação pendente.
            const agendamento =
                await Agendamento.findOneAndUpdate(
                    {
                        _id: id,
                        status: "pendente"
                    },
                    {
                        $set: { status }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                )
                    .populate("usuario", "nome email")
                    .populate("imovel", "titulo cidade bairro");

            if (!agendamento) {
                return res.status(409).json({
                    erro: "Essa solicitação não está mais pendente. Atualize a lista."
                });
            }

            return res.json({
                mensagem: status === "confirmado"
                    ? "Visita confirmada com sucesso!"
                    : "Solicitação de visita recusada.",
                agendamento
            });

        } catch (erro) {
            console.error(
                "Erro ao atualizar agendamento:",
                erro
            );

            return res.status(500).json({
                erro: "Não foi possível atualizar a solicitação."
            });
        }
    }
);

export default router;
