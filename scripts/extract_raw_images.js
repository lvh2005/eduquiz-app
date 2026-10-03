import fs from 'fs';
import zlib from 'zlib';

function extractImagesFromPdfBuffer(pdfPath, outputDir) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const buf = fs.readFileSync(pdfPath);
  const pdfStr = buf.toString('latin1');

  // Regex to find stream objects with /Subtype /Image
  const streamRegex = /<<([^>]*?\/Subtype\s*\/Image[^>]*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  let index = 0;

  while ((match = streamRegex.exec(pdfStr)) !== null) {
    index++;
    const dict = match[1];
    const streamStart = match.index + match[0].indexOf('stream') + 6;
    // Adjust streamStart for \r\n or \n
    let actualStart = streamStart;
    if (buf[actualStart] === 0x0d) actualStart++;
    if (buf[actualStart] === 0x0a) actualStart++;

    // Find endstream
    const endstreamPos = pdfStr.indexOf('endstream', actualStart);
    let actualEnd = endstreamPos;
    if (buf[actualEnd - 1] === 0x0a) actualEnd--;
    if (buf[actualEnd - 1] === 0x0d) actualEnd--;

    const rawStream = buf.slice(actualStart, actualEnd);

    // Check filter
    const isJpeg = dict.includes('/DCTDecode') || (rawStream[0] === 0xff && rawStream[1] === 0xd8);
    const isFlate = dict.includes('/FlateDecode');

    // Extract width/height
    const wMatch = dict.match(/\/Width\s+(\d+)/);
    const hMatch = dict.match(/\/Height\s+(\d+)/);
    const width = wMatch ? parseInt(wMatch[1]) : 0;
    const height = hMatch ? parseInt(hMatch[1]) : 0;

    console.log(`Image #${index}: width=${width}, height=${height}, size=${rawStream.length}, isJpeg=${isJpeg}, isFlate=${isFlate}`);

    if (isJpeg) {
      fs.writeFileSync(`${outputDir}/img_${index}_${width}x${height}.jpg`, rawStream);
    } else if (isFlate) {
      try {
        const decompressed = zlib.inflateSync(rawStream);
        console.log(`  Decompressed size: ${decompressed.length}`);
        // If RGB or Gray, we can write PPM/PNG or save raw
        fs.writeFileSync(`${outputDir}/img_${index}_${width}x${height}.raw`, decompressed);
      } catch (e) {
        console.log(`  Decompress error: ${e.message}`);
      }
    }
  }
}

extractImagesFromPdfBuffer('C:/Users/LEVUHA/Downloads/Mã nguồn mở.pdf', 'scripts/mnm_images');
