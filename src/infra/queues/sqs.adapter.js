import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

export function makeSqsQueuesAdapter({ queueUrl }) {
  const client = new SQSClient({}); // toma región/credenciales de ENV
  return {
    async sendFailedPayment(message) {
      if (!queueUrl) return; // noop si no hay URL
      const cmd = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          type: 'payment_failed',
          ts: Date.now(),
          ...message // { entityId, notificationUrl, status }
        })
      });
      await client.send(cmd);
    },
    // placeholder para suscripciones (usaremos ActiveMQ después)
    async sendFailedSubscription(_m) { /* noop por ahora */ }
  };
}
