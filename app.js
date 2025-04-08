import express from "express";
import friendRequestRoutes from "./routes/friendRequestRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import path from "path";
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';


const app = express();
const __dirname = path.resolve();

app.use(express.json()); 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/apiV1/swagger.yaml", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "apiV1", "swagger.yaml"));
  });
app.use("/apiV1/usuarios", friendRequestRoutes);
app.use("/apiV1/usuarios", usersRoutes);
app.use("/apiV1/usuarios", progressRoutes);


// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});