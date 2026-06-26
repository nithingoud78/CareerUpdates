const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../public');
const ogSrc = 'C:/Users/knith/Downloads/Telegram Desktop/New Project 14 [9EEAFB2].png';

async function generateSocialPreview() {
  console.log('Generating new social preview image...');
  
  await sharp(ogSrc)
    .resize({
      width: 1200,
      height: 630,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'social-preview.png'));

  console.log('Social preview image generated successfully!');
}

generateSocialPreview().catch(console.error);
