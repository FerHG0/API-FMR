import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorMiddlewere";

// --- SWAGGER ---
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

// Configurar dotenv
dotenv.config();

//conexión a la base de datos
import sequelize from "./config/db";

//Modelos ya relacionados
import { Usuario, Proveedor, Producto, Lote, Venta, DetalleVenta } from "./models";

// Rutas
import usuarioRoutes from "./routes/usuarioRoutes";
import proveedorRoutes from "./routes/proveedorRoutes"
import productoRoutes from "./routes/productoRoutes"


const app = express();

// --- Middlewares globales ---
app.use(cors());
app.use(express.json());
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: "JSON inválido en la petición"
    });
  }

  next();
});
// --- CONFIGURACIÓN DE SWAGGER ---
const swaggerSpec = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Farmacia Médica Rincón",
      version: "1.0.0",
      description: "Documentación de los endpoints para el sistema POS y control de inventario.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de Desarrollo",
      },
    ],
  },
  apis: ["./routes/*.ts"],
};

// interfaz gráfica de Swagger
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDoc(swaggerSpec)));

// Ruta de prueba (Health Check)
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "API de Farmacia Médica Rincón funcionando",
  });
});

// --- RUTAS ---
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/productos", productoRoutes);


// middleware de errores
app.use(errorHandler);

// --- Puerto al que se conecta ---
const PORT = process.env.PORT || 3000;

// Función asíncrona para iniciar todo
const startServer = async (): Promise<void> => {
  try {
    // 1. Verificar conexión
    await sequelize.authenticate();
    console.log("Conexión a MariaDB establecida correctamente.");

    // 2. Sincronizar modelos
    await sequelize.sync();
    console.log("Modelos y relaciones sincronizados en la base de datos.");

    // 3. Levantar servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error fatal al iniciar el servidor o conectar a la BD:", error);
  }
};

// Ejecutamos la función
startServer();