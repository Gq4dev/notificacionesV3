// test-receiver.js
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const KEY_B64 = process.env.PRIVATE_KEY_B64 || 'LOkWAdwE76d2nC+dnMWV7hxTWpP80fUs/GovYgqw9Wk='; 

app.post('/hook', (req, res) => {
  console.log('[hook] headers:', req.headers);
  console.log('[hook] raw body:', req.body);

  try {
    if (req.headers['x-content-encrypted'] === 'AES-256-GCM') {
      const { payload } = req.body || {};
      if (typeof payload !== 'string') throw new Error('payload faltante');

      const buf = Buffer.from(payload, 'base64');
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(12, 28);
      const ciphertext = buf.subarray(28);

      const key = Buffer.from(KEY_B64, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);

      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      const obj = JSON.parse(plaintext.toString('utf8'));

      console.log('[hook] decrypted object:', obj);
    }
  } catch (e) {
    console.error('[hook] decrypt error:', e);
  }

  return res.status(200).json({ ok: true });
});

app.listen(5001, () => console.log('receiver on :5001'));
