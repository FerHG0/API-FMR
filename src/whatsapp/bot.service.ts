import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import { generateDailySalesReport, getLowStockReport } from '../automations/services/report.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import Producto from '../../models/Producto';
import Lote from '../../models/Lote';
import { Venta } from '../../models';
import { Op } from 'sequelize';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ============================================================================
// 1. TIPOS Y CEREBRO DE LA IA
// ============================================================================
type IntencionBot = 'REPORTE_DIARIO' | 'REPORTE_STOCK_BAJO' | 'CONSULTAR_PRODUCTO' | 'RESUMEN_CAJA' | 'REPORTE_CADUCIDADES' | 'SALUDO' | 'DESCONOCIDO';

interface RespuestaIA {
    intencion: IntencionBot;
    fecha: string;
    fecha_limite?: string;
    datos?: {
        producto?: string;
    };
}

const procesarMensajeConIA = async (texto: string, audioBuffer?: Buffer, mimeType?: string): Promise<RespuestaIA> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const hoy = new Date().toISOString().split('T')[0]; 
        
        const prompt = `Eres el asistente experto de una farmacia. Hoy es ${hoy}.
        Tu única tarea es devolver un objeto JSON válido analizando este mensaje:
        "${texto}"
        
        Si el mensaje es "[Audio]", ignora el texto y escucha el archivo de voz adjunto.
        
        Reglas de clasificación para "intencion":
        - REPORTE_DIARIO: Si piden reporte de ventas, excel, ventas de ayer o resumen del día.
        - REPORTE_STOCK_BAJO: Si preguntan qué falta, qué comprar o inventario bajo.
        - CONSULTAR_PRODUCTO: Si preguntan precio, costo o existencias de un producto específico.
        - RESUMEN_CAJA: Si preguntan ganancias, dinero o corte de caja rápido.
        - REPORTE_CADUCIDADES: Si preguntan qué caduca pronto o mermas.
        - SALUDO: Saludos comunes (hola, buenos días).
        - DESCONOCIDO: Cualquier otro tema no relacionado a la farmacia.
        
        REGLA DE FECHAS:
        - "fecha": Si hablan del pasado o presente (ej. "ayer", "hoy"), pon la fecha exacta aquí.
        - "fecha_limite": SOLO para REPORTE_CADUCIDADES. Si el usuario menciona un lapso futuro ("en 5 meses", "este semestre", "a finales de año"), calcula la fecha final exacta tomando en cuenta que hoy es ${hoy}. Si NO especifica lapso, suma 90 días a ${hoy}.
        
        Formato de salida EXACTO:
        {
          "intencion": "UNA_DE_LAS_OPCIONES_DE_ARRIBA",
          "fecha": "YYYY-MM-DD",
          "fecha_limite": "YYYY-MM-DD",
          "datos": { "producto": "Nombre del producto si aplica, de lo contrario null" }
        }`;

        const parts: any[] = [{ text: prompt }];
        
        if (audioBuffer && mimeType) {
            // 🚀 EL FIX DEL AUDIO: Cortamos la basura de WhatsApp para que Gemini no crashee
            const mimeLimpio = mimeType.split(';')[0]; // Pasa de "audio/ogg; codecs=opus" a "audio/ogg"
            console.log(`[DEBUG IA] Enviando audio con formato limpio: ${mimeLimpio}`);
            parts.push({ inlineData: { data: audioBuffer.toString('base64'), mimeType: mimeLimpio } });
        }

        const result = await model.generateContent(parts);
        const responseText = result.response.text();
        
        console.log(`\n🤖 GEMINI RESPONDIÓ:\n`, responseText); // Veremos la respuesta cruda aquí

        // 🚀 EL FIX DEL TEXTO: Extraemos solo el JSON ignorando si Gemini añadió texto extra
        const match = responseText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("La IA no devolvió ninguna estructura JSON.");

        const parsed = JSON.parse(match[0]);
        
        return {
            intencion: parsed.intencion as IntencionBot,
            fecha: parsed.fecha || hoy,
            fecha_limite: parsed.fecha_limite,
            datos: parsed.datos || {}
        };
        
    } catch (error) {
        // Si vuelve a fallar, este mensaje rojo nos dirá exactamente la razón
        console.error("\n❌ ERROR CRÍTICO EN PROCESAMIENTO IA:", error);
        return { intencion: "DESCONOCIDO", fecha: new Date().toISOString().split('T')[0] };
    }
};

export let waSocket: any = null; // Variable global para usar WhatsApp en otros archivos

// ============================================================================
// 2. SERVICIO PRINCIPAL DE WHATSAPP
// ============================================================================
export const iniciarBotWhatsApp = async () => {
    console.log('🤖 Inicializando bot multimodal de Solo Lectura...');

    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        const { version } = await fetchLatestBaileysVersion();
        
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            syncFullHistory: false,
            browser: Browsers.macOS('Desktop') 
        });

        waSocket = sock;

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) qrcode.generate(qr, { small: true });

            if (connection === 'close') {
                const error = (lastDisconnect?.error as Boom)?.output?.statusCode;
                if (error !== DisconnectReason.loggedOut && error !== 405) {
                    setTimeout(() => iniciarBotWhatsApp(), 5000); 
                } else {
                    console.error('❌ Sesión de WhatsApp cerrada o inválida.');
                }
            } else if (connection === 'open') {
                console.log('✅ ¡Bot conectado y listo!');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            if (m.type !== 'notify') return;
            const msg = m.messages[0];
            
            const remitente = msg.key.remoteJid || '';
            
            // 🚀 DEBUG CRÍTICO: Ver todo lo que entra
            console.log(`\n--- NUEVO EVENTO DETECTADO ---`);
            console.log(`ID Remitente: ${remitente}`);
            console.log(`¿Viene de mí? (fromMe): ${msg.key.fromMe}`);
            console.log(`¿Tiene cuerpo de mensaje?: ${!!msg.message}`);

            if (!msg.message) {
                console.log('↪️ Ignorado: No tiene contenido.');
                return;
            }

            if (msg.key.fromMe) {
                console.log('↪️ Ignorado: El mensaje fue enviado por mí mismo.');
                return;
            }
            
            // Filtro para ignorar sistema y bots propios
            if (remitente.includes('status@broadcast')) {
                console.log('↪️ Ignorado: Es mensaje de sistema (status).');
                return;
            }

            const idLimpio = remitente.split('@')[0].split(':')[0];

            // NORMALIZACIÓN MÉXICO
            const normalizar = (num: string) => (num.startsWith('521') && num.length === 13) ? '52' + num.substring(3) : num;
            const idComparar = normalizar(idLimpio);
            const numerosPermitidos = process.env.ADMIN_WHATSAPP_NUMBERS?.split(',').map(n => normalizar(n.trim())) || [];

            console.log(`🔍 Comparando: [${idComparar}] contra Permitidos: [${numerosPermitidos}]`);

            if (!numerosPermitidos.includes(idComparar)) {
                console.log(`🔒 BLOQUEADO: El número ${idComparar} no está en la lista blanca.`);
                return;
            }
console.log('✅ PASÓ LOS FILTROS. Extrayendo contenido...');

            // 🚀 EXTRACCIÓN DE TEXTO SÚPER ROBUSTA (Rayos X)
            console.log("\n--- RAW JSON DEL MENSAJE ---");
            console.log(JSON.stringify(msg.message, null, 2));
            console.log("----------------------------\n");
            let textoRecibido = '';
            
            // WhatsApp esconde el texto en diferentes lugares según el dispositivo
            if (msg.message.conversation) {
                textoRecibido = msg.message.conversation;
            } else if (msg.message.extendedTextMessage?.text) {
                textoRecibido = msg.message.extendedTextMessage.text;
            } else if (msg.message.ephemeralMessage?.message?.conversation) {
                // Mensajes temporales o ruteados por @lid
                textoRecibido = msg.message.ephemeralMessage.message.conversation;
            } else if (msg.message.ephemeralMessage?.message?.extendedTextMessage?.text) {
                textoRecibido = msg.message.ephemeralMessage.message.extendedTextMessage.text;
            }

            console.log(`📝 Texto final enviado a IA: "${textoRecibido}"`);

            let audioBuffer: Buffer | undefined;
            let mimeType: string | undefined;

            // Detección de Audio (también puede venir envuelto en ephemeralMessage)
            const msgAudio = msg.message.audioMessage || msg.message.ephemeralMessage?.message?.audioMessage;
            
            if (msg.message.audioMessage) {
                console.log('🎙️ Descargando audio...');
                audioBuffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console as any, reuploadRequest: sock.updateMediaMessage }) as Buffer;
                mimeType = msg.message.audioMessage.mimetype || 'audio/ogg';
                textoRecibido = "[Audio]";
            }

            if (!textoRecibido && !audioBuffer) {
                console.log('↪️ Ignorado: El mensaje no contenía texto ni audio legible.');
                return;
            }

            // --- LLAMADA A LA IA ---
            const iaResponse = await procesarMensajeConIA(textoRecibido, audioBuffer, mimeType);
            console.log(`🧠 IA dice:`, iaResponse);

            // --- ENRUTAMIENTO DE INTENCIONES (SOLO GET) ---
            if (iaResponse.intencion === 'SALUDO') {
                await sock.sendMessage(remitente, { text: '¡Hola! Soy el asistente de lectura de la farmacia. 🤖💊\nPregúntame por reportes, precios o cortes de caja.' });
            
            } else if (iaResponse.intencion === 'REPORTE_DIARIO') {
                await sock.sendMessage(remitente, { text: `⏳ Generando reporte Excel del día ${iaResponse.fecha}...` });
                try {
                    const excelPath = await generateDailySalesReport(new Date(`${iaResponse.fecha}T12:00:00Z`)); 
                    await sock.sendMessage(remitente, { 
                        document: fs.readFileSync(excelPath), 
                        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                        fileName: `Reporte_${iaResponse.fecha}.xlsx` 
                    });
                    fs.unlinkSync(excelPath); // Auto limpieza
                } catch (err) {
                    await sock.sendMessage(remitente, { text: '❌ Error al generar el Excel.' });
                }

            } else if (iaResponse.intencion === 'CONSULTAR_PRODUCTO' && iaResponse.datos?.producto) {
                const nombreBuscado = iaResponse.datos.producto;
                await sock.sendMessage(remitente, { text: `🔍 Buscando coincidencias para: *${nombreBuscado}*...` });

                try {
                    // 1. Buscamos TODOS los productos que coincidan (Límite 5 para no saturar el chat)
                    const productos = await Producto.findAll({
                        where: {
                            nombre_comercial: { [Op.like]: `%${nombreBuscado}%` }
                        },
                        limit: 5 
                    });

                    if (productos.length === 0) {
                        await sock.sendMessage(remitente, { text: `❌ No encontré ningún medicamento llamado "${nombreBuscado}".` });
                    } else {
                        // 2. Armamos un mensaje con la lista de resultados
                        let respuesta = `💊 *RESULTADOS DE BÚSQUEDA (${productos.length})* 💊\n\n`;

                        // Iteramos sobre cada producto encontrado para calcular su stock
                        for (const prod of productos) {
                            const totalStock = await Lote.sum('cantidad', {
                                where: { id_producto: prod.id_producto } // Ajusta 'id_producto' a tu Primary Key si se llama distinto
                            }) || 0;

                            respuesta += `🔹 *${prod.nombre_comercial}*\n`;
                            respuesta += `   Precio: $${Number(prod.precio_venta).toFixed(2)}\n`;
                            respuesta += `   Existencia: ${totalStock} uds.\n`;
                            if (prod.requiere_receta) {
                                respuesta += `   _⚠️ Requiere receta_\n`;
                            }
                            respuesta += `\n`; // Espacio entre productos
                        }

                        await sock.sendMessage(remitente, { text: respuesta.trim() });
                    }
                } catch (error) {
                    console.error("[WhatsApp] Error en CONSULTAR_PRODUCTO:", error);
                    await sock.sendMessage(remitente, { text: '❌ Hubo un problema al consultar la base de datos.' });
                }
            } else if (iaResponse.intencion === 'RESUMEN_CAJA') {
                const fechaConsulta = iaResponse.fecha || new Date().toISOString().split('T')[0];
                await sock.sendMessage(remitente, { text: `💵 Calculando el corte de caja para el día *${fechaConsulta}*...` });

                try {
                    // Establecemos el rango del día completo (00:00 a 23:59)
                    const inicioDia = new Date(`${fechaConsulta}T00:00:00.000Z`);
                    const finDia = new Date(`${fechaConsulta}T23:59:59.999Z`);

                    const ventasDia = await Venta.findAll({
                        where: {
                            // Cambia 'fecha_venta' por 'createdAt' si tu modelo usa timestamps automáticos
                            fecha_venta: { 
                                [Op.between]: [inicioDia, finDia]
                            }
                        }
                    });

                    if (ventasDia.length === 0) {
                        await sock.sendMessage(remitente, { text: `📉 No hay ventas registradas para el día ${fechaConsulta}.` });
                    } else {
                        // Sumamos el campo 'total' de todas las ventas del array
                        const totalIngresos = ventasDia.reduce((sum, venta) => sum + Number(venta.total), 0);
                        const totalRecibido = ventasDia.reduce((sum, venta) => sum + Number(venta.dinero_recibido), 0);
                        const totalCambio = ventasDia.reduce((sum, venta) => sum + Number(venta.cambio), 0);
                        const cantidadVentas = ventasDia.length;

                        let respuesta = `📊 *CORTE DE CAJA RÁPIDO* 📊\n📅 Fecha: ${fechaConsulta}\n\n`;
                        respuesta += `• *Tickets Emitidos:* ${cantidadVentas}\n`;
                        respuesta += `• *Ingresos Totales:* $${totalIngresos.toFixed(2)} MXN\n`;
                        respuesta += `• *Dinero en Efectivo:* $${totalRecibido.toFixed(2)} MXN\n`;
                        respuesta += `• *Cambio Entregado:* $${totalCambio.toFixed(2)} MXN\n\n`;
                        respuesta += `_Para ver el detalle de los productos vendidos o quién fue el cajero, por favor solicita el REPORTE_DIARIO para generar el Excel._`;

                        await sock.sendMessage(remitente, { text: respuesta });
                    }
                } catch (error) {
                    console.error("[WhatsApp] Error en RESUMEN_CAJA:", error);
                    await sock.sendMessage(remitente, { text: '❌ Hubo un problema al calcular el corte de caja de la base de datos.' });
                }
                
            } else if (iaResponse.intencion === 'REPORTE_CADUCIDADES') {
                const limiteStr = iaResponse.fecha_limite || new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split('T')[0];
                await sock.sendMessage(remitente, { text: `📅 Revisando el almacén en busca de lotes que caduquen entre hoy y el *${limiteStr}*...` });
                try {
                    const hoy = new Date();
                    const limite = new Date(`${limiteStr}T23:59:59Z`); // Usamos la fecha calculada por la IA

                    const lotesEnRiesgo = await Lote.findAll({
                        where: {
                            fecha_caducidad: { [Op.between]: [hoy, limite] },
                            cantidad: { [Op.gt]: 0 }
                        },
                        order: [['fecha_caducidad', 'ASC']]
                    });
                    if (lotesEnRiesgo.length === 0) {
                        await sock.sendMessage(remitente, { text: `✅ Excelente noticia. No hay ningún lote en inventario que caduque en los próximos 3 meses.` });
                    } else {
                        let respuesta = `⚠️ *ALERTA DE CADUCIDADES* ⚠️\n_Próximos 90 días_\n\n`;

                        // 3. Iteramos para buscar el nombre del producto de cada lote
                        for (const lote of lotesEnRiesgo) {
                            const producto = await Producto.findByPk(lote.id_producto);
                            const nombreProd = producto ? producto.nombre_comercial : `Producto Desconocido (ID: ${lote.id_producto})`;
                            
                            // Formateamos la fecha al estilo local
                            const fechaFormat = new Date(lote.fecha_caducidad).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });
                            
                            respuesta += `🔻 *${nombreProd}*\n`;
                            respuesta += `   Lote físico: ${lote.codigo_lote_fisico}\n`;
                            respuesta += `   Vence: *${fechaFormat}*\n`;
                            respuesta += `   Stock en riesgo: ${lote.cantidad} cajas\n\n`;
                        }

                        await sock.sendMessage(remitente, { text: respuesta.trim() });
                    }
                } catch (error) {
                    console.error("[WhatsApp] Error en REPORTE_CADUCIDADES:", error);
                    await sock.sendMessage(remitente, { text: '❌ Hubo un problema al consultar las caducidades en la base de datos.' });
                }
                
            } else {
                await sock.sendMessage(remitente, { text: '🤔 No logré entenderte muy bien. Recuerda que solo puedo hacer consultas y reportes.' });
            }
        });

    } catch (error) {
        console.error('❌ Error fatal en WhatsApp:', error);
    }
};