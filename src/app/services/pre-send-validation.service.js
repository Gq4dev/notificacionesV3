export function makePreSendValidation() {
  return ({ entity, entityType, entityDefaults = {} }) => {
    if (entityDefaults.never_send_collector_notification === true ||
        entity?.never?.send?.collector?.notification === true) {
      return { ok: false, reason: 'never.send.collector.notification=true' };
    }
    const finalUrl = entity.notification_url || entityDefaults[`notification_url_${entityType}`];
    if (!finalUrl) return { ok: false, reason: 'notification_url missing' };
    return { ok: true, finalUrl };
  };
}
