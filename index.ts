import express, { Request, Response } from "express";
import cors, {CorsOptions} from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorMiddlewere";
// --- SWAGGER ---
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
// Configurar dotenv
dotenv.config();
//conexión a la base de datos
import sequelize from "./config/db";
// 1. Importaciones de automatizaciones
import { startAutomations } from './src/automations/cron/task';
import { iniciarBotWhatsApp } from './src/whatsapp/bot.service';

//Modelos ya relacionados
import { Usuario, Proveedor, Producto, Lote, Venta, DetalleVenta, Cliente} from "./models";

// Rutas
import usuarioRoutes from "./routes/usuarioRoutes";
import proveedorRoutes from "./routes/proveedorRoutes";
import productoRoutes from "./routes/productoRoutes";
import clientesRoutes from "./routes/clientesRoutes";
import loteRoutes from "./routes/loteRoutes"
import ventaRoutes from "./routes/ventaRoutes";
import doctorRoutes from "./routes/doctorRoutes"


// -----CONF CORS-----
const origenesPermitidos = [
  'http://localhost:5173', // El puerto por defecto de Vite (para que tu compañera pruebe en local)
  'http://161.35.234.161', // La IP del Droplet (para cuando el front esté en producción servido por Nginx en el puerto 80)
  'http://161.35.234.161:3000' // Por si hacen peticiones directas temporalmente
];

const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || origenesPermitidos.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, 
};


const app = express();
app.use(cors(corsOptions));

import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// --- Middlewares globales ---

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
      {
        url: 'http://161.35.234.161:3000',
        description: 'Servidor de Producción (Droplet)'
      }
    ],
  },
  apis: ["./routes/*.ts"],
};

// interfaz gráfica de Swagger
if (process.env.NODE_ENV !== 'production') {
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDoc(swaggerSpec)));
console.log('Documentación de la API habilitada en /api-docs');
}

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
app.use("/api/clientes", clientesRoutes);
app.use("/api/lotes", loteRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/doctores", doctorRoutes);

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

    startAutomations();
    iniciarBotWhatsApp();
  } catch (error) {
    console.error("Error fatal al iniciar el servidor o conectar a la BD:", error);
  }
};

// Ejecutamos la función
startServer();