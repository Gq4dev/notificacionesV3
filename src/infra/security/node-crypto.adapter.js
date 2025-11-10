import crypto from 'crypto';

/**
 * Cifra JSON con AES-256-GCM.
 * - keyB64: clave base64 de 32 bytes (256 bits)
 * - payload base64 = IV(12) | TAG(16) | CIPHERTEXT
 */
export function makeNodeCryptoAdapter({ defaultKeyB64 = '' } = {}) {
  return {
    maybeEncrypt(body, entity) {
      const keyB64 = entity?.private_key || defaultKeyB64;
      if (!keyB64) return { body, headers: {} }; // sin cifrado

      const key = Buffer.from(keyB64, 'base64');
      if (key.length !== 32) {
        // Si la clave no son 32 bytes, no ciframos (o podrías lanzar error)
        return { body, headers: {} };
      }

      const iv = crypto.randomBytes(12); // GCM usa IV de 12 bytes recomendado
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      const plaintext = Buffer.from(JSON.stringify(body), 'utf8');
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const tag = cipher.getAuthTag();

      // Empaquetamos IV + TAG + CIPHERTEXT en base64
      const payload = Buffer.concat([iv, tag, ciphertext]).toString('base64');

      return {
        body: { payload },
        headers: { 'X-Content-Encrypted': 'AES-256-GCM' }
      };
    }
  };
}
