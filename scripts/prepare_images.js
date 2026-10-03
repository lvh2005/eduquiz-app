import fs from 'fs';
import AdmZip from 'adm-zip';

// Load high-resolution images from docx & pdf
// In docx:
// image1.png (91 KB) = Hình 02 (XAMPP Control Panel)
// image2.png (175 KB) = Hình 03 (phpMyAdmin)
// image3.png (308 KB) = Hình 05 (Moodle Site Administration)
// image4.png (156 KB) = Hình 06 (Moodle Course Settings)
// image5.png (204 KB) = Hình 01 (Linux / OpenSource Terminal or Setup)

const docxZip = new AdmZip('C:/Users/LEVUHA/Downloads/Mã nguồn mở.docx');
const docxMedia = {};
for (const entry of docxZip.getEntries()) {
  if (entry.entryName.startsWith('word/media/')) {
    docxMedia[entry.name] = `data:image/png;base64,${entry.getData().toString('base64')}`;
  }
}

console.log('Loaded docx media:', Object.keys(docxMedia));

// Let's also check images extracted from PDF in scripts/mnm_images
const pdfImg1 = fs.existsSync('scripts/mnm_images/img_1_1680x936.png')
  ? `data:image/png;base64,${fs.readFileSync('scripts/mnm_images/img_1_1680x936.png').toString('base64')}`
  : null;
const pdfImg10 = fs.existsSync('scripts/mnm_images/img_10_445x384.jpg')
  ? `data:image/jpeg;base64,${fs.readFileSync('scripts/mnm_images/img_10_445x384.jpg').toString('base64')}`
  : null;
const pdfImg18 = fs.existsSync('scripts/mnm_images/img_18_901x344.jpg')
  ? `data:image/jpeg;base64,${fs.readFileSync('scripts/mnm_images/img_18_901x344.jpg').toString('base64')}`
  : null;
const pdfImg24 = fs.existsSync('scripts/mnm_images/img_24_1446x1087.jpg')
  ? `data:image/jpeg;base64,${fs.readFileSync('scripts/mnm_images/img_24_1446x1087.jpg').toString('base64')}`
  : null;
const pdfImg38 = fs.existsSync('scripts/mnm_images/img_38_1598x984.jpg')
  ? `data:image/jpeg;base64,${fs.readFileSync('scripts/mnm_images/img_38_1598x984.jpg').toString('base64')}`
  : null;

// Map figures to base64 images
const figureImages = {
  'hình 01': pdfImg1 || docxMedia['image5.png'],
  'hình 1': pdfImg1 || docxMedia['image5.png'],
  'hình 02': pdfImg10 || docxMedia['image1.png'],
  'hình 2': pdfImg10 || docxMedia['image1.png'],
  'hình 03': pdfImg18 || docxMedia['image2.png'],
  'hình 3': pdfImg18 || docxMedia['image2.png'],
  'hình 05': pdfImg24 || docxMedia['image3.png'],
  'hình 5': pdfImg24 || docxMedia['image3.png'],
  'hình 06': pdfImg38 || docxMedia['image4.png'],
  'hình 6': pdfImg38 || docxMedia['image4.png'],
};

console.log('Figure images ready. Total defined:', Object.keys(figureImages).length);
