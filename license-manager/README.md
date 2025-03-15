# License Manager System

A robust license management system for selling and managing script licenses. This system allows you to create, manage, and validate licenses with features like expiration dates and device limiting.

## Features

- 🔐 Secure admin login system
- 📝 Create and manage licenses
- ⏰ Automatic license expiration
- 📱 Device limiting per license
- 🔍 License validation API
- 📊 Dashboard for license management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 8000 by default.

## Admin Access

Default admin credentials:
- Username: `admin`
- Password: `password123`

**Important:** Change these credentials in production!

## API Endpoints

### Validate License
```
GET /api/validate
```
Query parameters:
- `licenseKey`: The license key to validate
- `scriptId`: ID of the script being validated
- `deviceId`: Unique identifier for the device

Response:
```json
{
    "valid": true,
    "message": "License is valid",
    "expiresAt": "2024-01-01T00:00:00.000Z",
    "maxDevices": 5,
    "devicesUsed": 2
}
```

### Get License Info
```
GET /api/license-info/:licenseKey
```
Returns public information about a license.

## Implementing License Validation

See `example-client-script.js` for a complete example of how to implement license validation in your scripts.

Basic implementation:

```javascript
const validator = new LicenseValidator(licenseKey, scriptId);
const isValid = await validator.validateLicense();

if (!isValid) {
    console.error('Invalid or expired license');
    process.exit(1);
}

// Your script code here...
```

## License Management

1. Log in to the admin dashboard at `/admin/login`
2. Create new licenses with:
   - Buyer name
   - Script ID
   - Duration (days)
   - Maximum allowed devices
3. View and manage existing licenses
4. Delete licenses if needed

## Security Features

- Password hashing using bcrypt
- Session-based authentication for admin access
- Automatic cleanup of expired licenses
- Device tracking to prevent excessive sharing
- Secure license key generation using UUID

## Production Deployment

Before deploying to production:

1. Change the admin credentials
2. Set up HTTPS
3. Update session secret in `index.js`
4. Configure proper error logging
5. Set up a proper database instead of JSON file storage
6. Configure CORS if needed
7. Set up proper monitoring and backup systems

## License Validation Process

1. Client script generates a unique device ID based on system information
2. Sends license key, script ID, and device ID to validation endpoint
3. Server checks:
   - License exists and matches script ID
   - License hasn't expired
   - Device count hasn't exceeded maximum
4. If validation passes, device is added to the license's device list
5. Response indicates if the license is valid and includes expiration info

## Error Handling

The system includes comprehensive error handling:
- Invalid license keys
- Expired licenses
- Maximum device limit reached
- Server errors
- Database access errors
- Authentication failures

## Automatic License Cleanup

A cron job runs every 5 minutes to:
- Check for expired licenses
- Remove or mark expired licenses
- Log cleanup activities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and feature requests, please create an issue in the repository.
