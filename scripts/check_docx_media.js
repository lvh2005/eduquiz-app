import AdmZip from 'adm-zip';
import fs from 'fs';

function checkDocxMedia() {
  const zip = new AdmZip('C:/Users/LEVUHA/Downloads/Mã nguồn mở.docx');
  const entries = zip.getEntries();
  const media = entries.filter(e => e.entryName.startsWith('word/media/'));
  console.log('Docx media entries:', media.map(m => m.entryName));
  
  if (!fs.existsSync('scripts/docx_media')) fs.mkdirSync('scripts/docx_media', { recursive: true });
  for (const m of media) {
    fs.writeFileSync(`scripts/docx_media/${m.name}`, m.getData());
    console.log(`Saved ${m.name}: ${m.getData().length} bytes`);
  }
}

checkDocxMedia();
