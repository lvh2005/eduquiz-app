import fs from 'fs';
import zlib from 'zlib';

const buf = fs.readFileSync('C:\\Users\\LEVUHA\\Downloads\\ketoanmay.pdf');

// Let's find each object containing /Subtype /Image
const objRegex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g;
let match;
let imgIndex = 0;
const images = [];

while ((match = objRegex.exec(buf.toString('latin1'))) !== null) {
  const objNum = match[1];
  const genNum = match[2];
  const objContent = match[3];

  if (objContent.includes('/Subtype /Image') || objContent.includes('/Subtype/Image')) {
    imgIndex++;
    console.log(`\n--- Image Object #${imgIndex} (obj ${objNum} ${genNum}) ---`);

    const widthMatch = objContent.match(/\/Width\s+(\d+)/);
    const heightMatch = objContent.match(/\/Height\s+(\d+)/);
    const filterMatch = objContent.match(/\/Filter\s*\/([a-zA-Z0-9_]+)/);
    const lengthMatch = objContent.match(/\/Length\s+(\d+)/);

    const width = widthMatch ? parseInt(widthMatch[1]) : 0;
    const height = heightMatch ? parseInt(heightMatch[1]) : 0;
    const filter = filterMatch ? filterMatch[1] : '';
    const length = lengthMatch ? parseInt(lengthMatch[1]) : 0;

    console.log(`Width: ${width}, Height: ${height}, Filter: ${filter}, Length: ${length}`);

    // Extract stream binary
    const streamStartIdx = match.index + match[0].indexOf('stream') + 6;
    let streamEndIdx = match.index + match[0].indexOf('endstream');
    // trim \r\n after stream
    let actualStart = streamStartIdx;
    if (buf[actualStart] === 0x0d && buf[actualStart + 1] === 0x0a) actualStart += 2;
    else if (buf[actualStart] === 0x0a || buf[actualStart] === 0x0d) actualStart += 1;

    const rawStream = buf.slice(actualStart, actualStart + length);

    if (filter === 'DCTDecode') {
      // JPEG image
      const filename = `scripts/extracted_img_${imgIndex}_obj${objNum}.jpg`;
      fs.writeFileSync(filename, rawStream);
      console.log(`Saved JPEG -> ${filename} (${rawStream.length} bytes)`);
      images.push({ index: imgIndex, objNum, width, height, type: 'jpg', path: filename, data: rawStream });
    } else if (filter === 'FlateDecode') {
      try {
        const decompressed = zlib.inflateSync(rawStream);
        console.log(`FlateDecoded stream (${decompressed.length} bytes)`);
        // We can inspect color space or save raw
        images.push({ index: imgIndex, objNum, width, height, type: 'flate', raw: decompressed });
      } catch (e) {
        console.log(`Inflate error: ${e.message}`);
      }
    }
  }
}

console.log(`\nExtracted ${images.length} images total.`);
