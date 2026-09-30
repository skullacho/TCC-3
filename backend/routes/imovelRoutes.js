import express from "express";
import mongoose from "mongoose";
import Imovel from "../models/Imovel.js";

const router = express.Router();


// ========================================
// LISTAR / PESQUISAR IMÓVEIS
// GET /api/imoveis
// ========================================

router.get("/", async (req, res) => {
    try {

        const {
            finalidade,
            tipo,
            cidade,
            bairro,
            quartos,
            precoMin,
            precoMax
        } = req.query;


        const filtro = {};


        if (finalidade) {
            filtro.finalidade = new RegExp(
                `^${finalidade}$`,
                "i"
            );
        }


        if (tipo) {
            filtro.tipo = new RegExp(
                `^${tipo}$`,
                "i"
            );
        }


        if (cidade) {
            filtro.cidade = new RegExp(
                cidade,
                "i"
            );
        }


        if (bairro) {
            filtro.bairro = new RegExp(
                bairro,
                "i"
            );
        }


        if (quartos) {
            filtro.quartos = {
                $gte: Number(quartos)
            };
        }


        if (precoMin || precoMax) {

            filtro.preco = {};

            if (precoMin) {
                filtro.preco.$gte =
                    Number(precoMin);
            }

            if (precoMax) {
                filtro.preco.$lte =
                    Number(precoMax);
            }
        }


        const imoveis = await Imovel
            .find(filtro)
            .sort({ createdAt: -1 });


        res.json(imoveis);


    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: "Erro ao buscar imóveis"
        });

    }
});


// ========================================
// BUSCAR UM IMÓVEL
// ========================================

router.get("/:id", async (req, res) => {

    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

            return res.status(400).json({
                erro: "ID inválido"
            });

        }


        const imovel =
            await Imovel.findById(
                req.params.id
            );


        if (!imovel) {

            return res.status(404).json({
                erro: "Imóvel não encontrado"
            });

        }


        res.json(imovel);


    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: "Erro ao buscar imóvel"
        });

    }

});


// ========================================
// CRIAR
// ========================================

router.post("/", async (req, res) => {

    try {

        const imovel =
            await Imovel.create(req.body);


        res.status(201).json(imovel);


    } catch (error) {

        console.error(error);

        res.status(400).json({
            erro: "Erro ao cadastrar imóvel",
            detalhes: error.message
        });

    }

});


// ========================================
// EDITAR
// ========================================

router.put("/:id", async (req, res) => {

    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

            return res.status(400).json({
                erro: "ID inválido"
            });

        }


        const imovel =
            await Imovel.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );


        if (!imovel) {

            return res.status(404).json({
                erro: "Imóvel não encontrado"
            });

        }


        res.json(imovel);


    } catch (error) {

        console.error(error);

        res.status(400).json({
            erro: "Erro ao editar imóvel"
        });

    }

});


// ========================================
// EXCLUIR
// ========================================

router.delete("/:id", async (req, res) => {

    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

            return res.status(400).json({
                erro: "ID inválido"
            });

        }


        const imovel =
            await Imovel.findByIdAndDelete(
                req.params.id
            );


        if (!imovel) {

            return res.status(404).json({
                erro: "Imóvel não encontrado"
            });

        }


        res.json({
            mensagem: "Imóvel excluído com sucesso"
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: "Erro ao excluir imóvel"
        });

    }

});


export default router;