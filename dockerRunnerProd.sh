#!/bin/sh

cd frontend
npm install 
( npm run start ) & SERVER_PID=$!

cd ../backend
npm install 
( npm run start ) & BACKEND_SERVER_PID=$!

# Handle application background process exiting
wait $SERVER_PID $BACKEND_SERVER_PID
EXIT_CODE=$?
echo "application exited with exit code $EXIT_CODE..."