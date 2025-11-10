// Ofusca campos sensibles. Respeta allow_commerce_pan_token para no ofuscar pan_token.
export function makeModelAccessObfuscator() {
  return {
    obfuscate(entity, { allowCommercePanToken = false } = {}) {
      const clone = JSON.parse(JSON.stringify(entity));

      // Ejemplos de campos típicos a ofuscar
      if (clone?.payer?.email) clone.payer.email = maskEmail(clone.payer.email);
      if (clone?.payer?.first_name) clone.payer.first_name = mask(clone.payer.first_name);
      if (clone?.payer?.last_name) clone.payer.last_name = mask(clone.payer.last_name);

      // payment.payment_methods[0].pan_token
      const pan = clone?.payment?.payment_methods?.[0]?.pan_token;
      if (pan && !allowCommercePanToken) {
        clone.payment.payment_methods[0].pan_token = maskCardToken(pan);
      }

      return clone;
    }
  };
}

function maskEmail(email) {
  const [u, d] = String(email).split('@');
  if (!d) return mask(email);
  const u2 = u.length <= 2 ? '*'.repeat(u.length) : u[0] + '*'.repeat(u.length - 2) + u[u.length - 1];
  return `${u2}@${d}`;
}
function mask(s) {
  s = String(s);
  if (s.length <= 4) return '*'.repeat(s.length);
  return s.slice(0, 2) + '*'.repeat(s.length - 4) + s.slice(-2);
}
function maskCardToken(token) {
  const s = String(token).replace(/\s+/g, '');
  if (s.length <= 8) return '*'.repeat(s.length);
  return s.slice(0, 4) + '*'.repeat(s.length - 8) + s.slice(-4);
}
