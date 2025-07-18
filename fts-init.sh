#!/bin/bash

# First we install the npm dependencies

npm install express bulma json-bigint cpu-features device-detector-js jquery bcrypt mariadb system-architecture memfs speakeasy qrcode framework7 framework7-icons linux-os-info express-jwt socket.io-client jsonwebtoken dotenv @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/free-brands-svg-icons @fortawesome/fontawesome-free --save

# Generate a Secret key for the installer


if [ $? -ne 0 ]; then
    echo "Error: Failed to install npm dependencies."
    exit 1
fi

# Then run the First Time Setup script
npm run first-time-setup

if [ $? -ne 0 ]; then
    echo "Error: Failed to run First Time Setup script."
    exit 1
fi