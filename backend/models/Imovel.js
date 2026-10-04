const API = "https://tcc-3-nnmd.onrender.com/api/imoveis";

import mongoose from "mongoose";


const imovelSchema = new mongoose.Schema(

    {

        // ==========================
        // INFORMAÇÕES PRINCIPAIS
        // ==========================

        titulo: {
            type: String,
            required: true
        },


        tipo: {
            type: String,
            required: true
        },


        finalidade: {
            type: String,
            required: true
        },


        preco: {
            type: Number,
            required: true
        },


        // ==========================
        // LOCALIZAÇÃO
        // ==========================

        cidade: {
            type: String,
            required: true
        },


        bairro: {
            type: String,
            required: true
        },


        endereco: {
            type: String,
            default: ""
        },


        latitude: {
            type: Number,
            default: null
        },


        longitude: {
            type: Number,
            default: null
        },


        // ==========================
        // DETALHES
        // ==========================

        area: {
            type: Number,
            default: 0
        },


        quartos: {
            type: Number,
            default: 0
        },


        banheiros: {
            type: Number,
            default: 0
        },


        vagas: {
            type: Number,
            default: 0
        },


        // ==========================
        // DESCRIÇÃO
        // ==========================

        descricao: {
            type: String,
            default: ""
        },


        // ==========================
        // IMAGENS
        // ==========================

        imagens: {
            type: [String],
            default: []
        },


        // ==========================
        // CARACTERÍSTICAS
        // ==========================

        caracteristicas: {
            type: [String],
            default: []
        },


        // ==========================
        // DESTAQUE
        // ==========================

        destaque: {
            type: Boolean,
            default: false
        },


        // ==========================
        // LANÇAMENTO
        // ==========================

        lancamento: {
            type: Boolean,
            default: false
        }

    },


    {
        timestamps: true
    }

);


const Imovel =
    mongoose.model(
        "Imovel",
        imovelSchema
    );


export default Imovel;
