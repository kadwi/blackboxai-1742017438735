const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

async function checkExpiredLicenses() {
    const licensesPath = path.join(__dirname, '../data/licenses.json');
    try {
        // Baca file licenses.json
        const data = await fs.readFile(licensesPath, 'utf8');
        const licenses = JSON.parse(data);
        const currentTime = new Date().getTime();

        // Filter lisensi yang masih valid (belum expired)
        const validLicenses = licenses.filter(license => {
            const expirationTime = new Date(license.expiresAt).getTime();
            const isExpired = currentTime > expirationTime;
            
            if (isExpired) {
                logger.info(`License expired and removed - Key: ${license.licenseKey}, Buyer: ${license.buyerName}, Expired: ${new Date(license.expiresAt).toLocaleDateString()}`);
            }
            
            return !isExpired;
        });

        // Jika ada lisensi yang expired, update file
        if (validLicenses.length !== licenses.length) {
            await fs.writeFile(licensesPath, JSON.stringify(validLicenses, null, 2));
            logger.info(`Removed ${licenses.length - validLicenses.length} expired licenses. Current active licenses: ${validLicenses.length}`);
        }
    } catch (error) {
        logger.error(`Error checking expired licenses: ${error.message}`);
    }
}

module.exports = checkExpiredLicenses;
