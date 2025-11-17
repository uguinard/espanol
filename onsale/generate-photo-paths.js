const fs = require('fs');
const path = require('path');

const inventoryDir = path.join(__dirname, 'inventory');
const optimizedDir = path.join(__dirname, 'inventory_optimized');
const outputFile = path.join(__dirname, 'photo_paths.csv');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

try {
  const itemFolders = fs.readdirSync(inventoryDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const csvRows = [];
  csvRows.push('ItemID,PhotoPaths'); // CSV Header
  let itemCount = 0;

  for (const itemName of itemFolders) {
    const itemPath = path.join(inventoryDir, itemName);
    const optimizedItemPath = path.join(optimizedDir, itemName);
    
    try {
      const files = fs.readdirSync(itemPath, { withFileTypes: true });
      const photoPaths = files
        .filter(dirent => dirent.isFile() && imageExtensions.includes(path.extname(dirent.name).toLowerCase()))
        .map(dirent => {
          const originalFilename = dirent.name;
          const safeFilename = originalFilename.replace(/\s+/g, '-');
          const oldPath = path.join(itemPath, originalFilename);
          const newPath = path.join(itemPath, safeFilename);

          if (oldPath !== newPath) {
            fs.renameSync(oldPath, newPath);
          }

          const ext = path.extname(safeFilename);
          const base = path.basename(safeFilename, ext);
          const optimizedPhoto = `${base}.webp`;
          const optimizedPhotoPath = path.join(optimizedItemPath, optimizedPhoto);

          if (fs.existsSync(optimizedPhotoPath)) {
            return `inventory_optimized/${itemName}/${optimizedPhoto}`;
          }
          return `inventory/${itemName}/${safeFilename}`;
        });

      if (photoPaths.length > 0) {
        itemCount++;
        csvRows.push(`"${itemName}","${photoPaths.join(',')}"`);
      }
    } catch (err) {
      console.error(`Could not read files in directory: ${itemPath}`, err);
    }
  }

  fs.writeFileSync(outputFile, csvRows.join('\n'));

  console.log(`Successfully generated photo paths CSV at: ${outputFile}`);
  console.log(`Found photo paths for ${itemCount} items.`);

} catch (err)
{
  console.error('Failed to read the inventory directory.', err);
}
