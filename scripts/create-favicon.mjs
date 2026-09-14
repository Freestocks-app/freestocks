import sharp from 'sharp';
import { promises as fs } from 'fs';

const SOURCE = './public/brand/freestocks-logo.png';
const ICON_OUT = './public/brand/freestocks-icon.png';
const FAVICON_OUT = './public/favicon.png';
const APPLE_TOUCH_OUT = './public/apple-touch-icon.png';

async function main() {
  const metadata = await sharp(SOURCE).metadata();
  console.log(`Source: ${metadata.width}x${metadata.height}`);
  
  // The icon is on the left side - extract square from left portion
  // Logo is 2172x724, icon takes roughly first 600px width
  const iconWidth = Math.floor(metadata.height * 0.9);
  
  const iconBuffer = await sharp(SOURCE)
    .extract({ left: 0, top: 0, width: iconWidth, height: metadata.height })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  
  await fs.writeFile(ICON_OUT, iconBuffer);
  console.log(`Created: ${ICON_OUT}`);
  
  // Favicon (32x32)
  await sharp(iconBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(FAVICON_OUT);
  console.log(`Created: ${FAVICON_OUT}`);
  
  // Apple touch icon (180x180 with dark bg)
  await sharp(iconBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile(APPLE_TOUCH_OUT);
  console.log(`Created: ${APPLE_TOUCH_OUT}`);
  
  console.log('Done!');
}

main().catch(console.error);
