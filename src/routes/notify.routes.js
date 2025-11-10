import { Router } from 'express';
import { makeDispatchNotification } from '../app/usecases/dispatch-notification.usecase.js';
import { makePreSendValidation } from '../app/services/pre-send-validation.service.js';
import { makeHttpNotifier } from '../infra/http/http-notifier.adapter.js';
import { makeMongoLogRepository } from '../infra/db/mongo-notification-log.repository.js';
//import { makeCryptoPassthrough } from '../infra/security/crypto.passthrough.adapter.js';
//import { makeObfuscationIdentity } from '../infra/security/obfuscation.identity.adapter.js';
//import { makeNoopQueues } from '../infra/queues/noop-queues.adapter.js';
import { makeModelAccessObfuscator } from '../infra/security/model-access.adapter.js';
import { makeNodeCryptoAdapter } from '../infra/security/node-crypto.adapter.js';
import { makeSqsQueuesAdapter } from '../infra/queues/sqs.adapter.js'
import 'dotenv/config';

const r = Router();

const usecase = makeDispatchNotification({
  notifier: makeHttpNotifier(),
  logs: makeMongoLogRepository(),
  preValidate: makePreSendValidation(),
  crypto: makeNodeCryptoAdapter({ defaultKeyB64: process.env.DEFAULT_ENCRYPTION_KEY_BASE64 || '' }),              
  obfuscator: makeModelAccessObfuscator(),      
  queue: makeSqsQueuesAdapter({ queueUrl: process.env.SQS_QUEUE_URL })
});

r.post('/payment', async (req, res) => {
  const { entity, defaults, force } = req.body || {};
  const result = await usecase({ entity, entityType: 'payment', entityDefaults: defaults || {}, force: !!force });
  res.status(200).json(result);
});

r.post('/subscription', async (req, res) => {
  const { entity, defaults, force } = req.body || {};
  const result = await usecase({ entity, entityType: 'subscription', entityDefaults: defaults || {}, force: !!force });
  res.status(200).json(result);
});

export default r;
