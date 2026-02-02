import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../apps/native/assets/images');
const ICON_SIZE = 1024;
const BACKGROUND_COLOR = '#E6F4FE';

async function generateCleanIcon() {
  const foregroundPath = path.join(ASSETS_DIR, 'android-icon-foreground.png');
  const outputPath = path.join(ASSETS_DIR, 'icon.png');
  const backupPath = path.join(ASSETS_DIR, 'icon-with-guides.png');

  console.log('Generating clean app icon...');

  // Backup the original icon with guides
  try {
    await sharp(outputPath).toFile(backupPath);
    console.log('Backed up original icon to icon-with-guides.png');
  } catch (e) {
    console.log('No existing icon to backup');
  }

  // Create a clean background
  const background = sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: BACKGROUND_COLOR
    }
  });

  // Get foreground dimensions
  const foregroundMeta = await sharp(foregroundPath).metadata();

  // Resize foreground to fit nicely in the icon (with padding)
  const foregroundSize = Math.round(ICON_SIZE * 0.7); // 70% of icon size
  const foreground = await sharp(foregroundPath)
    .resize(foregroundSize, foregroundSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Calculate position to center the foreground
  const offset = Math.round((ICON_SIZE - foregroundSize) / 2);

  // Composite foreground onto background
  await background
    .composite([{
      input: foreground,
      top: offset,
      left: offset
    }])
    .png()
    .toFile(outputPath);

  console.log(`Clean icon generated: ${outputPath}`);
  console.log(`Size: ${ICON_SIZE}x${ICON_SIZE}px`);

  // Also generate splash icon if needed
  const splashPath = path.join(ASSETS_DIR, 'splash-icon.png');
  const splashSize = 200;

  await sharp(foregroundPath)
    .resize(splashSize, splashSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(splashPath);

  console.log(`Splash icon updated: ${splashPath}`);
}

generateCleanIcon().catch(console.error);
