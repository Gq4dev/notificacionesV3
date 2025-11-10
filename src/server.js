import 'dotenv/config';
import { buildApp } from './app.js';
import { connectMongo } from './db/mongo.js';

const port = process.env.PORT || 4000;

(async () => {
  await connectMongo(process.env.MONGODB_URI);
  const app = buildApp();
  app.listen(port, () => console.log(`[api] :${port}`));
})();
