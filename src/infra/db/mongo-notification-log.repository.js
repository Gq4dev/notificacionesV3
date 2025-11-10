// src/infra/db/mongo-notification-log.repository.js
import { NotificationLog } from '../../models/NotificationLog.js';

export function makeMongoLogRepository() {
  return {
    async findOne(key) {
      return NotificationLog.findOne(key).lean();
    },

    async upsertWithSetOnInsert(key, patch) {
      // 1) Nunca permitas que 'attempts' entre al $set
      const { attempts, ...safePatch } = patch || {};

      // 2) Build update: 'attempts' SOLO en $inc (no en $set ni en $setOnInsert)
      const update = {
        $setOnInsert: { /* nada de attempts acá */ },
        $inc: { attempts: 1 },     // ← único lugar donde tocamos 'attempts'
        $set: safePatch            // resto del patch
      };

      // (debug opcional)
      // console.log('[update FOU]', JSON.stringify({ key, update }, null, 2));

      return NotificationLog.findOneAndUpdate(
        key,
        update,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true // opcional; no afecta a 'attempts'
        }
      );
    }
  };
}
