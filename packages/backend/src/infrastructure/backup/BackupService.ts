import fs from 'fs';
import { getPrismaClient } from '../persistence/prismaClient.js';
import { logger } from '../logging/logger.js';

function writeAsync(stream: fs.WriteStream, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = stream.write(data);
    if (success) {
      resolve();
    } else {
      stream.once('drain', () => resolve());
      stream.once('error', (err) => reject(err));
    }
  });
}

async function writeTableToStream(
  stream: fs.WriteStream,
  tableName: string,
  queryFn: (skip: number, take: number) => Promise<any[]>,
  chunkSize: number = 1000,
): Promise<number> {
  let skip = 0;
  let count = 0;
  await writeAsync(stream, `"${tableName}": [`);

  while (true) {
    const chunk = await queryFn(skip, chunkSize);
    if (!chunk || chunk.length === 0) break;

    for (let i = 0; i < chunk.length; i++) {
      if (count > 0) {
        await writeAsync(stream, ',\n');
      }
      await writeAsync(stream, JSON.stringify(chunk[i]));
      count++;
    }

    if (chunk.length < chunkSize) break;
    skip += chunkSize;
  }

  await writeAsync(stream, ']');
  return count;
}

export async function generateBackupStream(filepath: string): Promise<void> {
  const prisma = getPrismaClient();

  logger.info(`Iniciando generación de backup en stream hacia: ${filepath}`);

  // 1. Obtener conteos de forma altamente eficiente (SELECT COUNT(*))
  const counts = {
    usuarios: await prisma.usuario.count(),
    socios: await prisma.socio.count(),
    periodos: await prisma.periodo.count(),
    aportes: await prisma.aporte.count(),
    aporteDetalles: await prisma.aporteDetalle.count(),
    creditos: await prisma.credito.count(),
    pagoCuotas: await prisma.pagoCuota.count(),
    notificaciones: await prisma.notificacion.count(),
    configuraciones: await prisma.configuracion.count(),
    movimientos: await prisma.movimiento.count(),
    solidaridadMovimientos: await prisma.solidaridadMovimiento.count(),
    auditorias: await prisma.auditoria.count(),
    waLogs: await prisma.waLog.count(),
    acuerdosPago: await prisma.acuerdoPago.count(),
    dividendos: await prisma.dividendo.count(),
    dividendosSocios: await prisma.dividendoSocio.count(),
    creditoMovimientos: await prisma.creditoMovimiento.count(),
    cierresPeriodo: await prisma.cierrePeriodo.count(),
    configuracionHistorial: await prisma.configuracionHistorial.count(),
  };

  const metadata = {
    fecha: new Date().toISOString(),
    version: '1.1',
    totalRegistros: counts,
  };

  const stream = fs.createWriteStream(filepath);

  try {
    // Escribir cabecera del JSON y metadatos
    await writeAsync(stream, '{\n');
    await writeAsync(stream, `  "metadata": ${JSON.stringify(metadata, null, 2)},\n`);
    await writeAsync(stream, '  "data": {\n');

    // Mapeo de tablas y sus consultas paginadas
    const tables = [
      {
        name: 'usuarios',
        query: (skip: number, take: number) => prisma.usuario.findMany({ skip, take }),
      },
      {
        name: 'socios',
        query: (skip: number, take: number) => prisma.socio.findMany({ skip, take }),
      },
      {
        name: 'periodos',
        query: (skip: number, take: number) => prisma.periodo.findMany({ skip, take }),
      },
      {
        name: 'aportes',
        query: (skip: number, take: number) => prisma.aporte.findMany({ skip, take }),
      },
      {
        name: 'aporteDetalles',
        query: (skip: number, take: number) => prisma.aporteDetalle.findMany({ skip, take }),
      },
      {
        name: 'creditos',
        query: (skip: number, take: number) => prisma.credito.findMany({ skip, take }),
      },
      {
        name: 'pagoCuotas',
        query: (skip: number, take: number) => prisma.pagoCuota.findMany({ skip, take }),
      },
      {
        name: 'notificaciones',
        query: (skip: number, take: number) => prisma.notificacion.findMany({ skip, take }),
      },
      {
        name: 'configuraciones',
        query: (skip: number, take: number) => prisma.configuracion.findMany({ skip, take }),
      },
      {
        name: 'movimientos',
        query: (skip: number, take: number) => prisma.movimiento.findMany({ skip, take }),
      },
      {
        name: 'solidaridadMovimientos',
        query: (skip: number, take: number) =>
          prisma.solidaridadMovimiento.findMany({ skip, take }),
      },
      {
        name: 'auditorias',
        query: (skip: number, take: number) => prisma.auditoria.findMany({ skip, take }),
      },
      {
        name: 'waLogs',
        query: (skip: number, take: number) => prisma.waLog.findMany({ skip, take }),
      },
      {
        name: 'acuerdosPago',
        query: (skip: number, take: number) => prisma.acuerdoPago.findMany({ skip, take }),
      },
      {
        name: 'dividendos',
        query: (skip: number, take: number) => prisma.dividendo.findMany({ skip, take }),
      },
      {
        name: 'dividendosSocios',
        query: (skip: number, take: number) => prisma.dividendoSocio.findMany({ skip, take }),
      },
      {
        name: 'creditoMovimientos',
        query: (skip: number, take: number) => prisma.creditoMovimiento.findMany({ skip, take }),
      },
      {
        name: 'cierresPeriodo',
        query: (skip: number, take: number) => prisma.cierrePeriodo.findMany({ skip, take }),
      },
      {
        name: 'configuracionHistorial',
        query: (skip: number, take: number) =>
          prisma.configuracionHistorial.findMany({ skip, take }),
      },
    ];

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]!;
      logger.info(
        `Respaldando tabla "${table.name}" (${counts[table.name as keyof typeof counts]} registros)...`,
      );
      await writeTableToStream(stream, table.name, table.query);
      if (i < tables.length - 1) {
        await writeAsync(stream, ',\n');
      } else {
        await writeAsync(stream, '\n');
      }
    }

    // Escribir cierre del JSON
    await writeAsync(stream, '  }\n}');

    logger.info(`Backup finalizado y guardado con éxito en: ${filepath}`);
  } catch (err) {
    logger.error('Error durante la generación de la copia de seguridad', { error: String(err) });
    throw err;
  } finally {
    await new Promise<void>((resolve, reject) => {
      stream.end((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export async function restoreBackup(filepath: string): Promise<Record<string, number>> {
  if (!fs.existsSync(filepath)) {
    throw new Error(`El archivo de copia de seguridad no existe: ${filepath}`);
  }

  logger.info(`Leyendo archivo de backup desde: ${filepath}`);
  const rawData = fs.readFileSync(filepath, 'utf-8');
  const backup = JSON.parse(rawData);

  if (!backup.metadata || !backup.data) {
    throw new Error('Formato de archivo de copia de seguridad inválido.');
  }

  const prisma = getPrismaClient();
  const data = backup.data;
  const restoredCounts: Record<string, number> = {};

  logger.info('Iniciando restauración de base de datos...');

  // Ejecutamos limpieza y restauración en una transacción para evitar inconsistencias
  await prisma.$transaction(
    async (tx) => {
      // 1. Limpieza de tablas (Orden inverso de dependencias para evitar violaciones de clave foránea)
      const tablesToClean = [
        'dividendos_socios',
        'dividendos',
        'acuerdos_pago',
        'pago_cuotas',
        'credito_movimientos',
        'creditos',
        'aporte_detalles',
        'aportes',
        'socios',
        'periodos',
        'auditoria',
        'usuarios',
        'notificaciones',
        'configuracion_historial',
        'configuracion',
        'movimientos',
        'solidaridad_movimientos',
        'wa_logs',
        'cierres_periodo',
      ];

      logger.info('Limpiando tablas de base de datos...');
      for (const table of tablesToClean) {
        await tx.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      }

      // 2. Inserción de datos en orden correcto de dependencias
      const insertionQueue = [
        { name: 'usuarios', model: tx.usuario, data: data.usuarios },
        { name: 'periodos', model: tx.periodo, data: data.periodos },
        { name: 'socios', model: tx.socio, data: data.socios },
        { name: 'aportes', model: tx.aporte, data: data.aportes },
        { name: 'aporteDetalles', model: tx.aporteDetalle, data: data.aporteDetalles },
        { name: 'creditos', model: tx.credito, data: data.creditos },
        { name: 'pagoCuotas', model: tx.pagoCuota, data: data.pagoCuotas },
        { name: 'creditoMovimientos', model: tx.creditoMovimiento, data: data.creditoMovimientos },
        { name: 'cierresPeriodo', model: tx.cierrePeriodo, data: data.cierresPeriodo },
        { name: 'notificaciones', model: tx.notificacion, data: data.notificaciones },
        { name: 'configuraciones', model: tx.configuracion, data: data.configuraciones },
        {
          name: 'configuracionHistorial',
          model: tx.configuracionHistorial,
          data: data.configuracionHistorial,
        },
        { name: 'movimientos', model: tx.movimiento, data: data.movimientos },
        {
          name: 'solidaridadMovimientos',
          model: tx.solidaridadMovimiento,
          data: data.solidaridadMovimientos,
        },
        { name: 'auditorias', model: tx.auditoria, data: data.auditorias },
        { name: 'waLogs', model: tx.waLog, data: data.waLogs },
        { name: 'acuerdosPago', model: tx.acuerdoPago, data: data.acuerdosPago },
        { name: 'dividendos', model: tx.dividendo, data: data.dividendos },
        { name: 'dividendosSocios', model: tx.dividendoSocio, data: data.dividendosSocios },
      ];

      for (const item of insertionQueue) {
        if (item.data && item.data.length > 0) {
          logger.info(`Restaurando tabla "${item.name}" con ${item.data.length} registros...`);
          // Usamos createMany para inserciones en lote rápidas
          const result = await (item.model as any).createMany({ data: item.data });
          restoredCounts[item.name] = result.count;
        } else {
          restoredCounts[item.name] = 0;
        }
      }
    },
    {
      timeout: 60000, // 60 segundos de timeout para restauraciones grandes
    },
  );

  logger.info('Restauración completada con éxito.');
  return restoredCounts;
}
