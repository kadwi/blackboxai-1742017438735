const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Admin credentials (in production, these should be in a secure database)
const ADMIN_USERNAME = 'admin';
// Generated hash for password: 'password123'
const ADMIN_PASSWORD = '$2b$10$xx2D8EZoBU3vz2cr/dgpXODQpZGO6vyIMK2VQBdfbn/FavEOWe1Uq';

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/admin/login');
};

// Login page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Login handler
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // First check username to avoid timing attacks
        if (username !== ADMIN_USERNAME) {
            logger.info(`Failed login attempt with invalid username: ${username}`);
            return res.redirect('/admin/login?error=1');
        }

        // Then check password
        const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD);
        if (passwordMatch) {
            req.session.isAuthenticated = true;
            logger.info(`Successful login for admin user`);
            return res.redirect('/admin/dashboard');
        } else {
            logger.info(`Failed login attempt with invalid password for admin user`);
            return res.redirect('/admin/login?error=1');
        }
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        return res.redirect('/admin/login?error=1');
    }
});

// Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

// Get all licenses
router.get('/licenses', isAuthenticated, async (req, res) => {
    try {
        const licensesPath = path.join(__dirname, '../data/licenses.json');
        const data = await fs.readFile(licensesPath, 'utf8');
        const licenses = JSON.parse(data);
        res.json(licenses);
    } catch (error) {
        logger.error(`Error fetching licenses: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch licenses' });
    }
});

// Create new license
router.post('/create-license', isAuthenticated, async (req, res) => {
    try {
        const { buyerName, scriptId, duration, maxDevices } = req.body;
        
        if (!buyerName || !scriptId || !duration || !maxDevices) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

        const newLicense = {
            id: uuidv4(),
            buyerName,
            scriptId,
            licenseKey: uuidv4(),
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            maxDevices: parseInt(maxDevices),
            devicesUsed: []
        };

        const licensesPath = path.join(__dirname, '../data/licenses.json');
        const data = await fs.readFile(licensesPath, 'utf8');
        const licenses = JSON.parse(data);
        
        licenses.push(newLicense);
        await fs.writeFile(licensesPath, JSON.stringify(licenses, null, 2));

        res.json(newLicense);
    } catch (error) {
        logger.error(`Error creating license: ${error.message}`);
        res.status(500).json({ error: 'Failed to create license' });
    }
});

// Delete license
router.delete('/license/:id', isAuthenticated, async (req, res) => {
    try {
        const licenseId = req.params.id;
        const licensesPath = path.join(__dirname, '../data/licenses.json');
        const data = await fs.readFile(licensesPath, 'utf8');
        const licenses = JSON.parse(data);
        
        const filteredLicenses = licenses.filter(license => license.id !== licenseId);
        
        if (licenses.length === filteredLicenses.length) {
            return res.status(404).json({ error: 'License not found' });
        }

        await fs.writeFile(licensesPath, JSON.stringify(filteredLicenses, null, 2));
        res.json({ message: 'License deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting license: ${error.message}`);
        res.status(500).json({ error: 'Failed to delete license' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

module.exports = router;
