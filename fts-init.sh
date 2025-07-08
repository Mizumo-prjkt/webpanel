#!/bin/bash

# First we install the npm dependencies

npm install express bulma jquery bcrypt mariadb system-architecture memfs speakeasy qrcode framework7 framework7-icons --save

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