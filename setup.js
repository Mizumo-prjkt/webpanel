// First-time setup script for WebPanel
// This area is for setting up the project for the first time.
// Remember that the setup should be run on browsers

const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode');
const speakeasy = require('speakeasy');
const jsonBigInt = require('json-bigint');
const cpuidentify = require('cpu-features')();
const osInfo = require('linux-os-info');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const bcrypt = require('bcrypt');


// Load Env
require('dotenv').config();


// Startup run
console.log("Starting WebPanel first-time setup...");
console.log("CPU Hardware info:");
// Merge individual info into a single JSON
const cpuInfo = {
    brand: cpuidentify.brand,
    arch: cpuidentify.arch,
    architecture: cpuidentify.architecture,
    cpu: cpuidentify.cpu,
    family: cpuidentify.family,
    flags: cpuidentify.flags,
    platform: cpuidentify.platform,
    model: cpuidentify.model,
    stepping: cpuidentify.stepping
};
console.log(JSON.stringify(cpuInfo, null, 2));


// Remember also, that the first-time setup directory root is in fts/
// and only the files in fts/ should be accessed by the setup script.
// With exception on the final which requires the user to enter the port manually
// Remember to keep it in $USER/.config/webpanel/port_listen

const app = express();
const PORT = 3000; // Default port for the server

// MariaDB access
const mariadb = require('mariadb');
const dbConfig = {
    host: 'localhost',
    user: 'system',
    password: '000111',
    database: 'webpanel'
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'fts' dir and the node_modules directory
// Set fts as root directory for static files
app.use('/', express.static(path.join(__dirname, 'fts')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// API enpoints

// 1. Check user's browser with device-detector-js
const deviceDetector = require('device-detector-js');
const { features } = require('process');
const { connect } = require('http2');
app.post('/api/check-browser', (req, res) => {
    const userAgent = req.body.userAgent;
    const device = new deviceDetector().parse(userAgent);
    res.json({
        browser: device.client.name,
        version: device.client.version,
        os: device.os.name,
        device: device.device.type || 'desktop'
    });
});

// 2. Test API endpoint for response metric, i.e: how fast it can respond to a certain request

app.post('/api/basic-ping-test-response', (req, res) => {
    const startTime = Date.now();
    res.json({ message: 'Response time test successful' });
    const endTime = Date.now();
    console.log(`Response time: ${endTime - startTime} ms`);
});

// 3. Ping if the MariaDB is running
// Do not call the database, just check if the connection can be established
app.post('/api/check-mariadb', async (req, res) => {
    const startTime = Date.now();
    let connection;
    try {
        connection = await mariadb.createConnection(dbConfig);
        res.json({ status: 'success', message: 'MariaDB is running' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'MariaDB is not running', error: err.message });
    } finally {
        if (connection) {
            await connection.end();
            const endtime = Date.now();
            console.log(`MariaDB connection time: ${endtime - startTime} ms`);
        }
    }
});

// 4. Check Server's linux distribution
// This one is important

app.post('/api/check-linux-distribution', async (req, res) => {
    // Check if system is exactly Linux
    if (process.platform !== 'linux') {
        return res.status(400).json({
            status: 'error',
            message: 'This feature is only for Linux servers.'
        });
    }

    try {
        const info = await osInfo({ mode: 'promise' });
        res.json({
            status: 'success',
            // The package uses snake_case, we'll return camelCase for consistency
            prettyName: info.pretty_name,
            distro: info.id,
            distroVersion: info.version_id,
            details: info
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Could not determine the Linux distribution.',
            error: err.message
        });
    }
});

// 5. Token API verification for the user to confirm its really the user 
// we are facing.
// Use JWT with express-jwt
// Also with login mechanism

// Credential Platform
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set.');
    process.exit(1);
}

// EP for temporary token for setup
app.post('/api/get-setup-token', (req, res) => {
    const setupToken = jwt.sign(
        // We tell our purpose
        { scope: 'setup' },
        JWT_SECRET,
        { expiresIn: '5m', algorithm: 'HS256' }
    );
    res.json({ status: 'success', setupToken })
})

// Middleware protection
const requireSetupToken = expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256'],
    isRevoked: async (req, token) => {
        if (!token.payload || token.payload.scope !== 'setup') {
            return true; // Revoke token if its not intended for setup
        }
        return false;
    }
});

// User account creation endpoint

app.post('/api/create-admin-account', requireSetupToken, async (req, res) => {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Username and password are required.'
        })
    }
    if (password.length < 8) {
        return res.status(400).json({
            status: 'error',
            message: 'Password must be at least 8 characters long.'
        })
    }
    let connection;
    try {
        connection = await mariadb.createConnection(dbConfig);
        // Initiate transaction to ensure inserts succeed, or probably fail
        // because yknow, tokens?
        await connection.beginTransaction();


        // Session is first time setup, so no users should exist in the database
        const existingUsers = await connection.query("SELECT id FROM users LIMIT 1;");
        if (existingUsers.length > 0) {
            // return res.status(400).json({
            //     status: 'error',
            //     message: 'Some account exists on database for some reason? Did you run the setup twice or is the database compromised? Please report this issue immediately!'
            // });
            // NEW: if user exists, we should not proceed. Try rolling back things
            await connection.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Some account exists on database for some reason, are you sure that you only ran this setup once?\nIf problems continue, please check with the maintainer for solution'
            });
        }
        // Hash the password
        const saltingRound = 10;
        const password_hash = await bcrypt.hash(password, saltingRound);

        // User ID should start at 2000 as admin
        const user_id = 2000;

        // Get Admin role_id from the roles table
        let [adminRole] = await connection.query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
        if (!adminRole) {
            const createRoleResult = await connection.query("INSERT INTO roles (name) VALUES ('admin')");
            if (createRoleResult.affectedRows !== 1) {
                await connection.rollback();
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to create admin role.'
            });
        }
        [adminRole] = await connection.query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
        }
        const role_id = adminRole.id;

        // Create the new admin in users table
        const result = await connection.query(
            "INSERT INTO users (username, password_hash, user_id, is_active, role_id) VALUES (?, ?, ?, ?, ?)",
            [username, password_hash, user_id, 1, role_id]
        );

        // The permissions table's using user_id ref in the autoinc 'id' from users
        // Use insertId from previous query
        const newAdminID = result.insertId;
        // An admin strictly only needs 'manage' perms
        await connection.query(
            "INSERT INTO permissions (user_id, permission_type) VALUES (?, ?)",
            [newAdminID, 'manage']
        );


        // If we manage to get here, with both inserts being successful. Commit the transaction
        await connection.commit();

        if (result.affectedRows === 1) {
            res.status(201).json({
                status: 'success',
                message: 'Admin account created successfully.'
            });
        } else {
            // res.status(500).json({
            //     status: 'error',
            //     message: 'Failed to create admin account.'
            // });
            throw new Error("Failed to insert user to db, but transactions was comitted.")
        }
    } catch (err) {
        console.error('Error creating admin account:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: 'error',
                message: 'Username already exists.'
            });
        }
        res.status(500).json({
            status: 'error',
            message: err.sqlMessage || `An error occurred while creating the admin.`
        });
    } finally {
        // Close the connection
        if (connection) await connection.end();
    }
});

// Error handler for express-jwt

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        let message = 'Invalid or expired token'
        if (err.code === 'revoked_token') {
            message = 'A valid token for this session is required for this action.'
        }
        res.status(401).json({
            status: 'error',
            message: message,
            code: err.code
        });
    } else {
        next(err);
    }
})





// End of API endpoints

// GET
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'fts', 'index.html'));
});

app.get('/setup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'fts', 'assets', 'html' , 'setup.html'));
});

// Listen

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
