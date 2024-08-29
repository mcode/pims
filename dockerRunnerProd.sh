#!/bin/sh

cd frontend
npm install 
( npm run start ) & SERVER_PID=$!

cd ../backend
npm install 
( npm run start ) & BACKEND_SERVER_PID=$!
