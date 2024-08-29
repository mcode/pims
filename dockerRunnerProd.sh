#!/bin/sh

cd frontend
npm install | tee ./logs/frontend_installer.log
( npm run start | tee ./logs/frontend_runner.log ) & SERVER_PID=$!

cd ../backend
npm install | tee ./logs/backend_installer.log
( npm run start | tee ./logs/backend_runner.log ) & BACKEND_SERVER_PID=$!
