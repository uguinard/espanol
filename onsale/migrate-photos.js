const fs = require('fs');
const path = require('path');

const inventoryDir = path.join(__dirname, 'inventory');

try {
  const categoryFolders = fs.readdirSync(inventoryDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`Found ${categoryFolders.length} category folders. Starting migration...`);

  let filesMoved = 0;
  let foldersRemoved = 0;

  for (const categoryName of categoryFolders) {
    const categoryPath = path.join(inventoryDir, categoryName);
    const itemFolders = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const itemName of itemFolders) {
      const itemPath = path.join(categoryPath, itemName);
      const photosPath = path.join(itemPath, 'photos');

      if (fs.existsSync(photosPath) && fs.lstatSync(photosPath).isDirectory()) {
        const photoFiles = fs.readdirSync(photosPath, { withFileTypes: true })
          .filter(dirent => dirent.isFile());

        for (const photoFile of photoFiles) {
          const oldPath = path.join(photosPath, photoFile.name);
          const newPath = path.join(itemPath, photoFile.name);
          fs.renameSync(oldPath, newPath);
          filesMoved++;
        }

        // Check if directory is empty before removing
        try {
          fs.rmdirSync(photosPath);
          foldersRemoved++;
        } catch (err) {
          console.log(`Warning: Could not remove directory (it may not be empty): ${photosPath}`);
        }
      }
    }
  }

  console.log('--- Migration Summary ---');
  console.log(`Files moved: ${filesMoved}`);
  console.log(`'photos' folders removed: ${foldersRemoved}`);
  console.log('-------------------------');
  console.log('Migration complete.');

} catch (err) {
  console.error('An error occurred during migration:', err);
}
