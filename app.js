import express from "express";
import friendRequestRoutes from "./routes/friendRequestRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import playerRoutes from "./routes/playersRoutes.js";
import path from "path";

const app = express();
const __dirname = path.resolve();

app.use(express.json()); // Permitir JSON en las peticiones
app.use("/apiV1/usuarios", friendRequestRoutes);
app.use("/apiV1/usuarios", usersRoutes);
app.use("/apiV1/usuarios", progressRoutes);
app.use("/apiV1/usuarios", playerRoutes);


// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});