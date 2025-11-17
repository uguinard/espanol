const fs = require('fs-extra');
const path = require('path');
const Papa = require('papaparse');

const inventoryCsvPath = path.join(__dirname, 'inventory_export.csv');
const photosCsvPath = path.join(__dirname, 'photo_paths.csv');
const optimizedDir = path.join(__dirname, 'inventory_optimized');

async function checkCoherency() {
  console.log('Starting data coherency check...');

  try {
    // 1. Read CSV files
    const inventoryCsv = await fs.readFile(inventoryCsvPath, 'utf8');
    const photosCsv = await fs.readFile(photosCsvPath, 'utf8');

    const inventoryResult = Papa.parse(inventoryCsv, { header: true, skipEmptyLines: true });
    const photosResult = Papa.parse(photosCsv, { header: true, skipEmptyLines: true });

    const inventoryIds = new Set(inventoryResult.data.map(item => item.id).filter(Boolean));
    const photoItemIds = new Set(photosResult.data.map(item => item.ItemID).filter(Boolean));

    console.log(`Found ${inventoryIds.size} unique item IDs in inventory_export.csv`);
    console.log(`Found ${photoItemIds.size} unique item IDs in photo_paths.csv`);

    // 2. Cross-reference CSVs
    console.log('\n--- CSV Cross-Reference ---');
    const itemsWithoutPhotos = [...inventoryIds].filter(id => !photoItemIds.has(id));
    if (itemsWithoutPhotos.length > 0) {
      console.warn(`[WARNING] Items in inventory_export.csv but NOT in photo_paths.csv (no photos):`);
      itemsWithoutPhotos.forEach(id => console.warn(`  - ${id}`));
    } else {
      console.log('[OK] All items in inventory CSV have a corresponding entry in photo path CSV.');
    }

    const photosWithoutItems = [...photoItemIds].filter(id => !inventoryIds.has(id));
    if (photosWithoutItems.length > 0) {
      console.error(`[ERROR] Items in photo_paths.csv but NOT in inventory_export.csv (orphaned photos):`);
      photosWithoutItems.forEach(id => console.error(`  - ${id}`));
    } else {
      console.log('[OK] All items in photo path CSV have a corresponding entry in inventory CSV.');
    }

    // 3. Verify that photo files exist
    console.log('\n--- Photo File Verification ---');
    let brokenLinks = 0;
    const allPhotoPaths = new Set();
    for (const row of photosResult.data) {
      const paths = row.PhotoPaths.split(',').filter(Boolean);
      for (const p of paths) {
        allPhotoPaths.add(p);
        const fullPath = path.join(__dirname, p);
        if (!await fs.pathExists(fullPath)) {
          console.error(`[ERROR] Broken link: File not found for item '${row.ItemID}': ${p}`);
          brokenLinks++;
        }
      }
    }
    if (brokenLinks === 0) {
      console.log('[OK] All photo paths in photo_paths.csv point to existing files.');
    }

    // 4. Find unused image files
    console.log('\n--- Unused File Check ---');
    const allOptimizedFiles = new Set();
    const itemFolders = await fs.readdir(optimizedDir);
    for (const itemFolder of itemFolders) {
      const itemFolderPath = path.join(optimizedDir, itemFolder);
      if ((await fs.lstat(itemFolderPath)).isDirectory()) {
        const files = await fs.readdir(itemFolderPath);
        files.forEach(file => {
          allOptimizedFiles.add(`inventory_optimized/${itemFolder}/${file}`);
        });
      }
    }
    
    const unusedFiles = [...allOptimizedFiles].filter(file => !allPhotoPaths.has(file));
    if (unusedFiles.length > 0) {
        console.warn(`[WARNING] Found ${unusedFiles.length} unused image files in inventory_optimized:`);
        unusedFiles.forEach(file => {
          if (!path.basename(file).startsWith('.')) { // Ignore dotfiles like .DS_Store
            console.warn(`  - ${file}`);
          }
        });
    } else {
        console.log('[OK] No unused image files found in inventory_optimized.');
    }

    console.log('\nCoherency check complete.');

  } catch (error) {
    console.error('An error occurred during the coherency check:', error);
  }
}

checkCoherency();
