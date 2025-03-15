/**
 * Example script showing how to implement license validation
 * This would be the script that customers purchase and run
 */

const https = require('https');
const os = require('os');
const crypto = require('crypto');

class LicenseValidator {
    constructor(licenseKey, scriptId) {
        this.licenseKey = licenseKey;
        this.scriptId = scriptId;
        this.apiUrl = 'http://localhost:8000/api'; // Change this to your actual license server URL
    }

    // Generate a unique device ID based on system information
    generateDeviceId() {
        const systemInfo = [
            os.hostname(),
            os.platform(),
            os.arch(),
            os.cpus()[0].model,
            os.totalmem()
        ].join('|');

        return crypto
            .createHash('sha256')
            .update(systemInfo)
            .digest('hex');
    }

    // Validate the license
    async validateLicense() {
        const deviceId = this.generateDeviceId();
        const url = `${this.apiUrl}/validate?licenseKey=${this.licenseKey}&scriptId=${this.scriptId}&deviceId=${deviceId}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.valid) {
                throw new Error(`License validation failed: ${data.message}`);
            }

            console.log('License validated successfully!');
            console.log(`License expires on: ${new Date(data.expiresAt).toLocaleDateString()}`);
            console.log(`Devices used: ${data.devicesUsed}/${data.maxDevices}`);

            return true;
        } catch (error) {
            console.error('License validation error:', error.message);
            return false;
        }
    }
}

// Example usage:
async function runScript() {
    // Use our newly created license
    const LICENSE_KEY = '5e93b34f-f877-482b-a4d4-0b84772ce130';
    const SCRIPT_ID = 'example-script-v1';

    const validator = new LicenseValidator(LICENSE_KEY, SCRIPT_ID);
    const isValid = await validator.validateLicense();

    if (!isValid) {
        console.error('This script cannot run without a valid license.');
        process.exit(1);
    }

    // If we get here, the license is valid and we can run the actual script
    console.log('License is valid! Running the script...');
    
    // Your actual script code would go here
    console.log('Hello from the licensed script!');
}

// Run the script
runScript().catch(console.error);

/*
Example of how to use this in other scripts:

1. First, copy the LicenseValidator class to your script
2. Then add the validation check at the start of your script:

    const validator = new LicenseValidator('customer-license-key', 'your-script-id');
    const isValid = await validator.validateLicense();
    
    if (!isValid) {
        console.error('Invalid or expired license');
        process.exit(1);
    }

    // Rest of your script code here...

This ensures the script only runs with a valid license and hasn't reached its device limit.
*/
