const fs = require('fs');
const path = require('path');

const inventoryDir = path.join(__dirname, 'inventory_optimized'); // Changed this line
const outputFile = path.join(__dirname, 'photo_paths.csv');
const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png']; // Changed to only look for .webp

try {
  if (!fs.existsSync(inventoryDir)) {
    console.error(`Error: Source directory not found at ${inventoryDir}`);
    console.error('Please ensure the inventory_optimized directory exists and contains your image folders.');
    process.exit(1);
  }

  const itemFolders = fs.readdirSync(inventoryDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (itemFolders.length === 0) {
    console.error('No item folders found in inventory_optimized directory.');
    process.exit(1);
  }

  const csvRows = [];
  csvRows.push('ItemID,PhotoPaths'); // CSV Header
  let itemCount = 0;

  for (const itemName of itemFolders) {
    const itemPath = path.join(inventoryDir, itemName);
    
    try {
      const files = fs.readdirSync(itemPath, { withFileTypes: true });
      const photoPaths = files
        .filter(dirent => dirent.isFile() && imageExtensions.includes(path.extname(dirent.name).toLowerCase()))
        .map(dirent => {
          return `inventory_optimized/${itemName}/${dirent.name}`;
        });

      if (photoPaths.length > 0) {
        itemCount++;
        csvRows.push(`"${itemName}","${photoPaths.join(',')}"`);
      }
    } catch (err) {
      console.error(`Could not read files in directory: ${itemPath}`, err);
    }
  }

  try {
    fs.writeFileSync(outputFile, csvRows.join('\n'));
    console.log(`Successfully generated photo paths CSV at: ${outputFile}`);
    console.log(`Found photo paths for ${itemCount} items.`);
  } catch (writeErr) {
    console.error('Failed to write CSV file:', writeErr);
    process.exit(1);
  }

} catch (err) {
  console.error('Failed to read the inventory directory.', err);
}
