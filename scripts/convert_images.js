import fs from 'fs';
import { PNG } from 'pngjs';
import crypto from 'crypto';

function convertRawToPng() {
  const dir = 'scripts/mnm_images';
  const files = fs.readdirSync(dir);
  const hashes = new Map();

  for (const f of files) {
    const fullPath = `${dir}/${f}`;
    if (f.endsWith('.raw')) {
      const match = f.match(/img_(\d+)_(\d+)x(\d+)\.raw/);
      if (match) {
        const [, idx, w, h] = match;
        const width = parseInt(w);
        const height = parseInt(h);
        const raw = fs.readFileSync(fullPath);
        
        // 1680x936 * 3 = 4717440 (RGB)
        const png = new PNG({ width, height });
        if (raw.length === width * height * 3) {
          for (let i = 0, j = 0; i < raw.length; i += 3, j += 4) {
            png.data[j] = raw[i];
            png.data[j + 1] = raw[i + 1];
            png.data[j + 2] = raw[i + 2];
            png.data[j + 3] = 255;
          }
        }
        const pngBuf = PNG.sync.write(png);
        const pngPath = `${dir}/img_${idx}_${width}x${height}.png`;
        fs.writeFileSync(pngPath, pngBuf);
        console.log(`Converted ${f} to PNG: ${pngBuf.length} bytes`);
      }
    }
  }

  // Check unique images by hash
  const allImgs = fs.readdirSync(dir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log('--- Unique Images ---');
  for (const f of allImgs) {
    const buf = fs.readFileSync(`${dir}/${f}`);
    const hash = crypto.createHash('md5').update(buf).digest('hex');
    if (!hashes.has(hash)) {
      hashes.set(hash, f);
      console.log(`Unique Image: ${f}, size=${buf.length}, hash=${hash}`);
    } else {
      console.log(`Duplicate: ${f} is identical to ${hashes.get(hash)}`);
    }
  }
}

convertRawToPng();
