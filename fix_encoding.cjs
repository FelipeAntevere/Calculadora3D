const fs = require('fs');
const path = require('path');

const parts = [
    'app_part1.txt',
    'app_part2.txt',
    'app_part3.txt',
    'app_part4.txt'
];

let finalContent = '';
parts.forEach(part => {
    const content = fs.readFileSync(path.join(__dirname, part), 'utf8');
    finalContent += content;
});

// Systematically fix any potential double-encoding or corrupted strings if they somehow got in
// (Though view_file says parts are clean, this is a safety net)
const replacements = {
    'Ã£': 'ã',
    'Ã§': 'ç',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ãª': 'ê',
    'Ã´': 'ô',
    'Ã': 'Á', // careful with single char replacements
    'Ã‡': 'Ç',
    'Âº': 'º',
    'Âª': 'ª',
    'Ã±': 'ç', // User screenshot showed PeÃ±as, suggesting ñ might be a corrupted ç in some contexts
};

Object.entries(replacements).forEach(([bad, good]) => {
    const regex = new RegExp(bad, 'g');
    finalContent = finalContent.replace(regex, good);
});

// Fix Nan issues in table/modals found during audit
// Replace {formatCurrency(order.unitValue * order.quantity)} with {formatCurrency((order.unitValue || 0) * (order.quantity || 0))}
finalContent = finalContent.replace(/formatCurrency\(order\.unitValue \* order\.quantity\)/g, 'formatCurrency((order.unitValue || 0) * (order.quantity || 0))');
finalContent = finalContent.replace(/formatCurrency\(order\.unitValue\)/g, 'formatCurrency(order.unitValue || 0)');
finalContent = finalContent.replace(/formatCurrency\(order\.freight\)/g, 'formatCurrency(order.freight || 0)');
finalContent = finalContent.replace(/formatCurrency\(order\.total\)/g, 'formatCurrency(order.total || 0)');

fs.writeFileSync(path.join(__dirname, 'App.tsx'), finalContent, 'utf8');
console.log('App.tsx reconstructed successfully with UTF-8 encoding and fixes.');
