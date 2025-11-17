# On-Sale Inventory Viewer

This project is a simple HTML page to preview an inventory of items for sale from a local CSV file.

## How to Use

### 1. Prerequisite
You must have Python 3 installed on your computer. Most modern operating systems (like macOS and Linux) have it pre-installed. You can check by opening a terminal or command prompt and running:
```bash
python3 --version
```

### 2. Viewing the Page
Because web browsers have security restrictions that prevent loading local data files directly, you need to run a simple local web server to view this page.

**Instructions:**
1.  Open your terminal or command prompt.
2.  Navigate to the directory where the `onsale.html` file is located.
3.  Run the following command:
    ```bash
    python3 -m http.server
    ```
4.  The terminal will show a message like `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/)`.
5.  Open your web browser and go to the following address:
    [http://localhost:8000/onsale.html](http://localhost:8000/onsale.html)

You should now see your inventory page, fully loaded with data from `inventory_export.csv`.

### 3. Updating Photo Paths
To avoid writing every photo path by hand, you can use the included Node.js helper script.

**Prerequisite:** You must have Node.js installed.

**Instructions:**
1.  Organize your photos in the `inventory/` directory following this structure: `inventory/category/item-name/photos/your-image.jpg`.
2.  Run the script from the project's root directory:
    ```bash
    node generate-photo-paths.js
    ```
3.  This will create a `photo_paths.csv` file. You can copy the generated paths from this file and paste them into your main `inventory_export.csv` file.
