import 'dotenv/config';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, ChangeMessageVisibilityCommand } from '@aws-sdk/client-sqs';
import axios from 'axios';
import mongoose from 'mongoose';
import { NotificationLog } from '../models/NotificationLog.js';

const QUEUE_URL = process.env.SQS_QUEUE_URL;
const MONGODB_URI = process.env.MONGODB_URI;

if (!QUEUE_URL) throw new Error('SQS_QUEUE_URL no configurado');
if (!MONGODB_URI) throw new Error('MONGODB_URI no configurado');

const sqs = new SQSClient({});
await mongoose.connect(MONGODB_URI, { dbName: 'notificaciones' });

console.log('[worker] payments SQS escuchando...');

async function processMessage(msg) {
  if (!msg || !msg.Body) {
    console.warn('[worker] mensaje vacío o sin Body, se descarta.');
    return true; // borramos igual
  }

  let payload;
  try {
    payload = JSON.parse(msg.Body);
  } catch (e) {
    console.error('[worker] Body no es JSON válido:', msg.Body);
    return true; // borramos el mensaje roto
  }

  const { entityId, notificationUrl } = payload || {};
  if (!entityId || !notificationUrl) {
    console.warn('[worker] Mensaje sin entityId o notificationUrl:', payload);
    return true;
  }

  console.log(`[worker] Reintentando notificación ${entityId} -> ${notificationUrl}`);

  // Buscar en Mongo
  const key = { entityType: 'payment', entityId: String(entityId), notificationUrl };
  const log = await NotificationLog.findOne(key);
  if (!log) {
    console.warn('[worker] No se encontró log para', key);
    return true;
  }

  // reconstruir body y headers
  const headers = log?.headers || {};
  const body = headers['X-Content-Encrypted']
    ? { payload: 'RE-ENVIAR_NO_IMPLEMENTADO' } // más adelante re-ciframos
    : (log.payload || {});

  // Reintento
  let status = 599;
  try {
    const res = await axios.post(notificationUrl, body, {
      headers: { 'Content-Type': 'application/json', ...headers },
      validateStatus: () => true
    });
    status = res.status;
  } catch (err) {
    console.error('[worker] Error en POST:', err.message);
  }

  await NotificationLog.findOneAndUpdate(
    key,
    {
      $set: {
        statusCode: status,
        lastAttemptAt: new Date()
      },
      $inc: { attempts: 1 }
    },
    { new: true }
  );

  console.log(`[worker] Resultado ${status} para ${entityId}`);

  // borrar si 2xx, dejar si no
  return String(status).startsWith('2');
}


async function loop() {
  while (true) {
    const { Messages } = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 15,
      VisibilityTimeout: 60
    }));

    if (!Messages || Messages.length === 0) continue;

    for (const msg of Messages) {
      try {
        const ok = await processMessage(msg);
        if (ok) {
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: msg.ReceiptHandle
          }));
        } else {
          const base = 30; // segundos
          const attempt = Number(payload.attempt || 1);
          const nextDelay = Math.min(base * Math.pow(2, attempt - 1), 15 * 60); // cap 15m

          await sqs.send(new ChangeMessageVisibilityCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: msg.ReceiptHandle,
            VisibilityTimeout: nextDelay
          }));
        }
      } catch (e) {
        // si explota el procesamiento, no borramos => reintento por SQS
        console.error('[worker] error procesando msg:', e?.message || e);
      }
    }
  }
}

loop().catch(err => {
  console.error('[worker] fatal:', err);
  process.exit(1);
});
