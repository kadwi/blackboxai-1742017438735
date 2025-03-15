const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'license-manager-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true in production with HTTPS
}));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize licenses.json if it doesn't exist
const initializeLicensesFile = async () => {
    const licensesPath = path.join(__dirname, 'data', 'licenses.json');
    try {
        await fs.access(licensesPath);
    } catch (error) {
        await fs.writeFile(licensesPath, '[]');
        logger.info('Created licenses.json file');
    }
};

// Cron job to check expired licenses
cron.schedule('*/5 * * * *', async () => {
    const licensesPath = path.join(__dirname, 'data', 'licenses.json');
    try {
        const data = await fs.readFile(licensesPath, 'utf8');
        const licenses = JSON.parse(data);
        const currentTime = new Date().getTime();

        const validLicenses = licenses.filter(license => {
            const expirationTime = new Date(license.expiresAt).getTime();
            return expirationTime > currentTime;
        });

        if (validLicenses.length !== licenses.length) {
            await fs.writeFile(licensesPath, JSON.stringify(validLicenses, null, 2));
            logger.info(`Removed ${licenses.length - validLicenses.length} expired licenses`);
        }
    } catch (error) {
        logger.error(`Error in cron job: ${error.message}`);
    }
});

// Routes
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});

// Initialize data and start server
const PORT = process.env.PORT || 8000;

(async () => {
    try {
        await initializeLicensesFile();
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
})();
