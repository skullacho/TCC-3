import mongoose from "mongoose";
const schema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true, index: true },
  imovel: { type: mongoose.Schema.Types.ObjectId, ref: "Imovel", required: true },
  data: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  horario: { type: String, required: true, enum: ["09:00", "11:00", "14:00", "16:00"] },
  telefone: { type: String, required: true, maxlength: 30 },
  status: { type: String, enum: ["pendente", "confirmado", "cancelado", "recusado"], default: "pendente" }
}, { timestamps: true });
schema.index({ imovel: 1, data: 1, horario: 1 }, { unique: true, partialFilterExpression: { status: { $in: ["pendente", "confirmado"] } } });
export default mongoose.model("Agendamento", schema);
