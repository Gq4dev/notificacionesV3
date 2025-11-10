import mongoose from 'mongoose';

const NotificationLogSchema = new mongoose.Schema({
  entityType: { type: String, enum: ['payment', 'subscription'], required: true },
  entityId:   { type: String, required: true },
  notificationUrl: { type: String, required: true },
  payload:    { type: Object, required: true },
  obfuscated: { type: Boolean, default: false },
  encrypted:  { type: Boolean, default: false },
  force:      { type: Boolean, default: false },
  statusCode: { type: Number },
  responseBody: { type: String },
  lastAttemptAt: { type: Date },
  attempts:   { type: Number, default: 0 },
  headers:    { type: Object },
  meta: { type: Object }
}, { timestamps: true });

NotificationLogSchema.index(
  { entityType: 1, entityId: 1, notificationUrl: 1 },
  { unique: true }
);

export const NotificationLog = mongoose.model('NotificationLog', NotificationLogSchema);
