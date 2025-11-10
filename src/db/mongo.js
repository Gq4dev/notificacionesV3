import mongoose from 'mongoose';

export async function connectMongo(mongoUri) {
  if (!mongoUri) throw new Error('MONGODB_URI no configurado');
  await mongoose.connect(mongoUri, { dbName: 'notificaciones' });
  console.log('[mongo] conectado');
}
