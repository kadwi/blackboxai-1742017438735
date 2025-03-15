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

// Import cron job checker
const checkExpiredLicenses = require('./cron/check_expired');

// Run initial check for expired licenses
checkExpiredLicenses().catch(error => {
    logger.error(`Initial expired license check failed: ${error.message}`);
});

// Schedule cron job to check expired licenses every hour
// Format: '0 * * * *' = run at minute 0 of every hour
// This ensures consistent timing regardless of when the server starts
cron.schedule('0 * * * *', checkExpiredLicenses, {
    scheduled: true,
    timezone: "UTC"
});

// Also check every time the server starts
logger.info('Scheduling license expiration checks for every hour at minute 0');

// Routes
// Redirect root to admin login
app.get('/', (req, res) => {
    res.redirect('/admin/login');
});

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
