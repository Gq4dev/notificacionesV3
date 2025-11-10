/**
 * @param {Object} deps
 * @param {import('../../domain/ports/notifier.port.js').NotifierPort} deps.notifier
 * @param {import('../../domain/ports/log-repository.port.js').LogRepositoryPort} deps.logs
 * @param {(args:{entity:any,entityType:string,entityDefaults:any})=>{ok:boolean, finalUrl?:string, reason?:string}} deps.preValidate
 * @param {{maybeEncrypt:(body:any, entity:any)=>{body:any, headers:Record<string,string>}}} deps.crypto
 * @param {{obfuscate:(entity:any, opts:{allowCommercePanToken:boolean})=>any}} deps.obfuscator
 * @param {{sendFailedPayment:(m:any)=>Promise<void>, sendFailedSubscription:(m:any)=>Promise<void>}} deps.queue
 */
export function makeDispatchNotification({ notifier, logs, preValidate, crypto, obfuscator, queue }) {
  return async function dispatchNotification({ entity, entityType, force = false, entityDefaults = {} }) {
    const { ok, finalUrl, reason } = preValidate({ entity, entityType, entityDefaults });
    if (!ok) return { sent: false, reason };

console.log('[notify] POST ->', finalUrl); // 👈 log directo para confirmar URL

    const allowCommercePanToken = Boolean(entityDefaults.allow_commerce_pan_token || entity.allow_commerce_pan_token);
    const payload = obfuscator.obfuscate(entity, { allowCommercePanToken });

    const { body, headers } = crypto.maybeEncrypt(payload, entity);

    const key = { entityType, entityId: String(entity.id), notificationUrl: finalUrl };
    const existing = await logs.findOne(key);
    if (existing?.statusCode && String(existing.statusCode).startsWith('2') && !force) {
      return { sent: false, reason: 'already-successful' };
    }

    const res = await notifier.postJson(finalUrl, body, headers).catch(e => ({ status: 599, data: String(e) }));

    console.log('[notify] status <-', res.status);
    await logs.upsertWithSetOnInsert(key, {
      payload,
      obfuscated: true,
      encrypted: Boolean(headers['X-Content-Encrypted']),
      force: Boolean(force),
      lastAttemptAt: new Date(),
      statusCode: res.status,
      responseBody: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
      headers,
      meta: {
        neverSendCollectorNotification: Boolean(
          entityDefaults.never_send_collector_notification || entity?.never?.send?.collector?.notification
        ),
        allowCommercePanToken
      }
      // 👈 NO incluir 'attempts' acá
    });


    if (!String(res.status).startsWith('2')) {
      if (entityType === 'payment') await queue.sendFailedPayment({ entityId: entity.id, notificationUrl: finalUrl, status: res.status });
      else if (entityType === 'subscription') await queue.sendFailedSubscription({ entityId: entity.id, notificationUrl: finalUrl, status: res.status });
      return { sent: false, status: res.status };
    }
    return { sent: true, status: res.status };
  };
}
