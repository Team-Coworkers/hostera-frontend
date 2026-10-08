import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = fileURLToPath(new URL('.', import.meta.url));
const dataDirectory = path.join(serverDirectory, 'data');
const databaseFile = path.join(serverDirectory, 'db.json');
const database = {};
const files = fs
  .readdirSync(dataDirectory)
  .filter((file) => file.endsWith('.json'))
  .sort();

for (const file of files) {
  const content = JSON.parse(
    fs.readFileSync(path.join(dataDirectory, file), 'utf8'),
  );
  const resource = path.basename(file, '.json');

  if (
    !Array.isArray(content?.[resource]) ||
    Object.keys(content).length !== 1
  ) {
    throw new Error(`${file}: expected one array named "${resource}".`);
  }

  Object.assign(database, content);
}

fs.writeFileSync(
  `${databaseFile}.tmp`,
  `${JSON.stringify(database, null, 2)}\n`,
);
fs.renameSync(`${databaseFile}.tmp`, databaseFile);
