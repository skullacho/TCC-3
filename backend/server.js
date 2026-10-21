import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import imovelRoutes from "./routes/imovelRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import agendamentoRoutes from "./routes/agendamentoRoutes.js";

// Carrega o .env que está na mesma pasta do server.js
dotenv.config({
  path: new URL("./.env", import.meta.url)
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/imoveis", imovelRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/agendamentos", agendamentoRoutes);

app.get("/", (req, res) => {
  res.json({
    mensagem: "API da imobiliária funcionando!"
  });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("Configure JWT_SECRET com pelo menos 32 caracteres no ambiente.");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error(
    "ERRO: MONGODB_URI não foi encontrada. Verifique se o arquivo .env existe na pasta backend."
  );
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB conectado com sucesso!");

    app.listen(process.env.PORT || 3000, () => {
      console.log(
        `Servidor rodando em http://localhost:${process.env.PORT || 3000}`
      );
    });
  })
  .catch((error) => {
    console.error("ERRO ao conectar ao MongoDB:");
    console.error(error.message);
  });