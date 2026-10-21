import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  senhaHash: { type: String, required: true, select: false }
}, { timestamps: true });

export default mongoose.model("Usuario", usuarioSchema);
