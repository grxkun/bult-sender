const fs = require('fs');
const { ethers } = require('ethers');

/**
 * Generate a CSV file with test addresses for bulk sending
 * This creates valid Ethereum addresses for testing purposes
 */
function generateTestCSV(count = 100) {
    if (count > 1000) {
        console.error('❌ Maximum 1000 addresses allowed');
        return;
    }

    console.log(`📝 Generating CSV with ${count} test addresses...`);
    
    let csvContent = 'address,amount\n';
    
    for (let i = 0; i < count; i++) {
        // Generate a random wallet
        const wallet = ethers.Wallet.createRandom();
        const address = wallet.address;
        
        // Generate a random amount between 1 and 1000
        const amount = (Math.random() * 999 + 1).toFixed(2);
        
        csvContent += `${address},${amount}\n`;
    }
    
    const filename = `examples/test-${count}-addresses.csv`;
    fs.writeFileSync(filename, csvContent);
    
    console.log(`✅ Generated ${filename}`);
    console.log(`💰 Total addresses: ${count}`);
    
    // Calculate total amount
    const lines = csvContent.split('\n').slice(1, -1); // Remove header and empty last line
    const totalAmount = lines.reduce((sum, line) => {
        const amount = parseFloat(line.split(',')[1]);
        return sum + amount;
    }, 0);
    
    console.log(`💎 Total tokens needed: ${totalAmount.toFixed(2)}`);
    console.log(`\n🚀 Usage:`);
    console.log(`npm start send-csv -t <TOKEN_ADDRESS> -f ${filename}`);
}

// Command line interface
if (require.main === module) {
    const count = parseInt(process.argv[2]) || 100;
    generateTestCSV(count);
}

module.exports = { generateTestCSV };