const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../public');
const iconSrc = 'C:/Users/knith/Downloads/Telegram Desktop/file_000000000b247208b45f87af3e129203.png';

async function generateFavicon(size, filename) {
  // We want the icon to occupy ~80% of the canvas. 10% padding on each side.
  const padding = Math.round(size * 0.10);
  const innerSize = size - (padding * 2);
  
  await sharp(iconSrc)
    .trim()
    .resize({
      width: innerSize,
      height: innerSize,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, filename));
}

async function generateFavicons() {
  console.log('Generating favicons with 80% coverage...');
  
  await generateFavicon(16, 'favicon-16x16.png');
  await generateFavicon(32, 'favicon-32x32.png');
  await generateFavicon(180, 'apple-touch-icon.png');
  await generateFavicon(192, 'android-chrome-192.png');
  await generateFavicon(512, 'android-chrome-512.png');

  // Create favicon.ico using the 32x32 png
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));

  console.log('Favicons generated successfully!');
}

generateFavicons().catch(console.error);
