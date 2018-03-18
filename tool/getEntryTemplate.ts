const fs = require('fs');

export default function getEntryTemplate(entryName, resolve) {
    let fullPath = `entry/${entryName}.html`;

    try {
        fs.accessSync(fullPath, fs.constants.R_OK);
    } catch (e) {
        fullPath = resolve(`entry/${entryName}.ejs`);
    }

    return fullPath;
}
