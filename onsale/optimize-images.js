const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

const inventoryDir = path.join(__dirname, 'inventory');
const optimizedDir = path.join(__dirname, 'inventory_optimized');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

const TARGET_WIDTH = 800; // pixels

async function optimizeImages() {
  try {
    console.log('Starting image optimization...');
    await fs.ensureDir(optimizedDir);

    const itemFolders = await fs.readdir(inventoryDir);
    let optimizedCount = 0;
    let skippedCount = 0;

    for (const itemName of itemFolders) {
      const itemPath = path.join(inventoryDir, itemName);
      const stat = await fs.lstat(itemPath);

      if (!stat.isDirectory()) {
        continue;
      }

      const optimizedItemPath = path.join(optimizedDir, itemName);
      await fs.ensureDir(optimizedItemPath);

      const files = await fs.readdir(itemPath);

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!imageExtensions.includes(ext)) {
          continue;
        }

        const sourcePath = path.join(itemPath, file);
        const destFilename = `${path.basename(file, ext)}.webp`;
        const destPath = path.join(optimizedItemPath, destFilename);

        if (await fs.pathExists(destPath)) {
          skippedCount++;
          continue;
        }

        try {
          await sharp(sourcePath)
            .resize(TARGET_WIDTH, null, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({ quality: 80 })
            .toFile(destPath);
          
          optimizedCount++;
        } catch (err) {
          console.error(`Failed to process ${sourcePath}:`, err.message);
        }
      }
    }

    console.log('--- Optimization Summary ---');
    console.log(`Successfully optimized ${optimizedCount} new images.`);
    console.log(`Skipped ${skippedCount} already existing images.`);
    console.log('----------------------------');
    console.log('Optimization complete.');

  } catch (err) {
    console.error('An error occurred during image optimization:', err);
  }
}

optimizeImages();
