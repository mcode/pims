#!/bin/sh

cd frontend
npm run build
( npm run preview ) & SERVER_PID=$!

cd ../backend
( npm run start ) & BACKEND_SERVER_PID=$!

# Handle application background process exiting
wait $SERVER_PID $BACKEND_SERVER_PID
EXIT_CODE=$?
echo "application exited with exit code $EXIT_CODE..."