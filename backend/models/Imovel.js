import mongoose from "mongoose";

const imovelSchema = new mongoose.Schema(
  {
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

    descricao: {
      type: String,
      default: ""
    },

    imagens: {
      type: [String],
      default: []
    },

    caracteristicas: {
      type: [String],
      default: []
    },

    destaque: {
      type: Boolean,
      default: false
    },

    lancamento: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Imovel = mongoose.model("Imovel", imovelSchema);

export default Imovel;