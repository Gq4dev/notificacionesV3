export function makeNoopQueues() {
  return {
    async sendFailedPayment(_m) { /* noop */ },
    async sendFailedSubscription(_m) { /* noop */ }
  };
}
