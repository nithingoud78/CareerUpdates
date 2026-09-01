import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';

async function run() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  page.drawText('This is a dummy resume text for parsing.', {
    x: 50,
    y: 700,
    size: 24,
    color: rgb(0, 0.53, 0.71),
  });
  const pdfBytes = await pdfDoc.save();
  
  try {
    const parser = new PDFParse(pdfBytes);
    await parser.load();
    const text = await parser.getText();
    console.log("Extracted:", text);
  } catch (err) {
    console.error("Extraction error:", err);
  }
}
run();
