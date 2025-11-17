const fs = require('fs');
const path = require('path');

const inventoryDir = path.join(__dirname, 'inventory');
const outputFile = path.join(__dirname, 'photo_paths.csv');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

try {
  const categoryFolders = fs.readdirSync(inventoryDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const csvRows = [];
  csvRows.push('ItemID,PhotoPaths'); // CSV Header
  let itemCount = 0;

  for (const categoryName of categoryFolders) {
    const categoryPath = path.join(inventoryDir, categoryName);
    const itemFolders = fs.readdirSync(categoryPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const itemName of itemFolders) {
      const itemPath = path.join(categoryPath, itemName);
      const photosPath = path.join(itemPath, 'photos'); // Look inside the 'photos' subdirectory
      
      try {
        // Check if the photos subdirectory exists
        if (fs.existsSync(photosPath) && fs.lstatSync(photosPath).isDirectory()) {
          const files = fs.readdirSync(photosPath);
          const photoPaths = files
            .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
            .map(file => `inventory/${categoryName}/${itemName}/photos/${file}`); // Create the full relative path

          if (photoPaths.length > 0) {
            itemCount++;
            csvRows.push(`"${categoryName}/${itemName}","${photoPaths.join(',')}"`);
          }
        }
      } catch (err) {
        console.error(`Could not read files in directory: ${photosPath}`, err);
      }
    }
  }

  // Write the collected rows to a CSV file
  fs.writeFileSync(outputFile, csvRows.join('\\n'));

  console.log(`Successfully generated photo paths CSV at: ${outputFile}`);
  console.log(`Found photo paths for ${itemCount} items.`);

} catch (err) {
  console.error('Failed to read the inventory directory.', err);
}
