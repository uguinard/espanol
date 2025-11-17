const fs = require('fs-extra');
const path = require('path');

const inventoryDir = path.join(__dirname, 'inventory');

async function cleanInventory() {
  try {
    console.log('Starting inventory cleanup...');
    const topLevelEntries = fs.readdirSync(inventoryDir, { withFileTypes: true });

    // Get all category directories (e.g., 'electronics', 'home-living')
    const categoryDirs = topLevelEntries.filter(dirent => {
      if (!dirent.isDirectory()) {
        return false;
      }
      // A simple heuristic: if the name is one of our known category folders, treat it as such.
      const knownCategories = ['electronics', 'home-living', 'sports-outdoor', 'vehicles', 'appliances'];
      return knownCategories.includes(dirent.name);
    });

    let filesMoved = 0;
    
    // 1. Consolidate files from nested directories to top-level directories
    for (const categoryDir of categoryDirs) {
        const categoryPath = path.join(inventoryDir, categoryDir.name);
        if (!fs.lstatSync(categoryPath).isDirectory()) continue;

        const itemDirs = fs.readdirSync(categoryPath);
        for (const itemName of itemDirs) {
            const nestedItemPath = path.join(categoryPath, itemName);
            if (!fs.lstatSync(nestedItemPath).isDirectory()) continue;

            const topLevelItemPath = path.join(inventoryDir, itemName);
            
            // Ensure top-level destination exists
            await fs.ensureDir(topLevelItemPath);

            // Move all files
            const files = fs.readdirSync(nestedItemPath);
            for (const file of files) {
                const sourcePath = path.join(nestedItemPath, file);
                const destPath = path.join(topLevelItemPath, file);
                // Avoid overwriting; add a suffix if file exists.
                if (fs.existsSync(destPath)) {
                    const ext = path.extname(file);
                    const base = path.basename(file, ext);
                    const newDestPath = path.join(topLevelItemPath, `${base}_${Date.now()}${ext}`);
                    await fs.move(sourcePath, newDestPath);
                } else {
                    await fs.move(sourcePath, destPath);
                }
                filesMoved++;
            }
        }
    }
    console.log(`Consolidated ${filesMoved} files.`);

    // 2. Remove the old, now-empty category directories
    let dirsRemoved = 0;
    for (const categoryDir of categoryDirs) {
        // Double-check it's a folder name we expect, not an item folder
        if (['electronics', 'home-living', 'sports-outdoor', 'vehicles', 'appliances'].includes(categoryDir.name)) {
            const categoryPath = path.join(inventoryDir, categoryDir.name);
            await fs.remove(categoryPath);
            dirsRemoved++;
        }
    }
    console.log(`Removed ${dirsRemoved} old category directories.`);
    
    // 3. Remove leftover empty item directories at the top level
    const finalEntries = fs.readdirSync(inventoryDir);
    let emptyDirsRemoved = 0;
    for(const entry of finalEntries) {
        const fullPath = path.join(inventoryDir, entry);
        if(fs.lstatSync(fullPath).isDirectory() && fs.readdirSync(fullPath).length === 0) {
            await fs.remove(fullPath);
            emptyDirsRemoved++;
        }
    }
    console.log(`Removed ${emptyDirsRemoved} empty item directories.`);


    console.log('Cleanup complete.');

  } catch (err) {
    console.error('An error occurred during cleanup:', err);
  }
}

cleanInventory();
