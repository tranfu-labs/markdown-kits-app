import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const assetsDir = path.resolve('dist/assets');
const maxMainBytes = Number(process.env.BUNDLE_MAX_MAIN_BYTES || 450_000);
const maxMainGzipBytes = Number(process.env.BUNDLE_MAX_MAIN_GZIP_BYTES || 165_000);

const files = await readdir(assetsDir);
const entryFiles = files.filter((file) => file.startsWith('index-') && file.endsWith('.js'));

if (entryFiles.length === 0) {
  throw new Error('No main entry bundle found in dist/assets');
}

const entries = await Promise.all(
  entryFiles.map(async (file) => {
    const content = await readFile(path.join(assetsDir, file));
    return {
      file,
      bytes: content.byteLength,
      gzipBytes: gzipSync(content).byteLength
    };
  })
);

const main = entries.sort((a, b) => b.bytes - a.bytes)[0];
const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

console.log(`Main entry bundle: ${main.file} ${kib(main.bytes)} raw, ${kib(main.gzipBytes)} gzip`);

if (main.bytes > maxMainBytes || main.gzipBytes > maxMainGzipBytes) {
  throw new Error(
    `Main entry bundle exceeds budget: raw ${kib(main.bytes)} / ${kib(maxMainBytes)}, gzip ${kib(main.gzipBytes)} / ${kib(maxMainGzipBytes)}`
  );
}
