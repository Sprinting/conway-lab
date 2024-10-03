const fs = require('fs');
const path = require('path');

const patternsDir = '.';
const indexFile = path.join(patternsDir, 'index.json');

function generateIndex() {
    fs.readdir(patternsDir, (err, files) => {
        if (err) {
            console.error('Error reading patterns directory:', err);
            return;
        }

        // Filter for CSV files
        const csvFiles = files.filter(file => file.endsWith('.rle'));
        console.log(csvFiles)

        // Sort files alphabetically
        csvFiles.sort();

        // Write the index file
        fs.writeFile(indexFile, JSON.stringify(csvFiles, null, 2), (err) => {
            if (err) {
                console.error('Error writing index file:', err);
            } else {
                console.log(`Successfully generated index.json with ${csvFiles.length} patterns to ${indexFile} `);
            }
        });
    });
}

// Check if patterns directory exists
if (!fs.existsSync(patternsDir)) {
    console.error(`The directory ${patternsDir} does not exist. Please create it and add your pattern files.`);
} else {
    generateIndex();
}