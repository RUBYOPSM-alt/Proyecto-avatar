#!/bin/bash
echo "Setup: installing server and web dependencies..."
cd server
npm install
cd ../web
npm install
echo "Done. Edit server/.env with your API keys."
