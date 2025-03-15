const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

// Validate license
router.get('/validate', async (req, res) => {
    try {
        const { licenseKey, scriptId, deviceId } = req.query;

        if (!licenseKey || !scriptId || !deviceId) {
            return res.status(400).json({
                valid: false,
                message: 'Missing required parameters'
            });
        }

        const licensesPath = path.join(__dirname, '../data/licenses.json');
        const data = await fs.readFile(licensesPath, 'utf8');
        const licenses = JSON.parse(data);

        const license = licenses.find(l => l.licenseKey === licenseKey && l.scriptId === scriptId);

        if (!license) {
            return res.json({
                valid: false,
                message: 'Invalid license key or script ID'
            });
        }

        // Check if license has expired
        const expirationTime = new Date(license.expiresAt).getTime();
        const currentTime = new Date().getTime();

        if (currentTime > expirationTime) {
            return res.json({
                valid: false,
                message: 'License has expired'
            });
        }

        // Check device limit
        if (!license.devicesUsed.includes(deviceId)) {
            if (license.devicesUsed.length >= license.maxDevices) {
                return res.json({
                    valid: false,
                    message: 'Maximum device limit reached'
                });
            }

            // Add new device
            license.devicesUsed.push(deviceId);
            
            // Update licenses file
            const updatedLicenses = licenses.map(l => 
                l.id === license.id ? license : l
            );
            await fs.writeFile(licensesPath, JSON.stringify(updatedLicenses, null, 2));
        }

        // License is valid
        return res.json({
            valid: true,
            message: 'License is valid',
            expiresAt: license.expiresAt,
            maxDevices: license.maxDevices,
            devicesUsed: license.devicesUsed.length
        });

    } catch (error) {
        logger.error(`License validation error: ${error.message}`);
        res.status(500).json({
            valid: false,
            message: 'Internal server error'
        });
    }
});

// Get license info (for debugging/testing)
router.get('/license-info/:licenseKey', async (req, res) => {
    try {
        const { licenseKey } = req.params;
        const licensesPath = path.join(__dirname, '../data/licenses.json');
        const data = await fs.readFile(licensesPath, 'utf8');
        const licenses = JSON.parse(data);

        const license = licenses.find(l => l.licenseKey === licenseKey);

        if (!license) {
            return res.status(404).json({
                message: 'License not found'
            });
        }

        res.json({
            buyerName: license.buyerName,
            scriptId: license.scriptId,
            expiresAt: license.expiresAt,
            maxDevices: license.maxDevices,
            devicesUsed: license.devicesUsed.length
        });

    } catch (error) {
        logger.error(`License info error: ${error.message}`);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});

module.exports = router;
