#!/bin/sh

# Handle closing application on signal interrupt (ctrl + c)
trap 'kill $CONTINUOUS_INSTALL_PID $SERVER_PID $BACKEND_SERVER_PID; exit' INT

mkdir -p logs
touch ./logs/frontend_installer.log
touch ./logs/frontend_runner.log
touch ./logs/backend_installer.log
touch ./logs/backend_runner.log

# Reset log file content for new application boot
echo "*** Logs for continuous frontend installer ***" > ./logs/frontend_installer.log
echo "*** Logs for frontend 'npm run start' ***" > ./logs/frontend_runner.log

echo "*** Logs for continuous backend installer ***" > ./logs/backend_installer.log
echo "*** Logs for backend 'npm run start' ***" > ./logs/backend_runner.log

# Print that the application is starting in watch mode
echo "starting application in watch mode..."

# Start the continious build listener process
echo "starting continuous installers..."

if [ ! -d frontend/node_modules ]; then
    cd frontend
    npm install | tee ../logs/frontend_installer.log
    cd ..
fi

if [ ! -d backend/node_modules ]; then
    cd backend
    npm install | tee ../logs/backend_installer.log
    cd ..
fi

( file_hash() {
    cksum "$1" 2>/dev/null || echo "missing $1"
}

package_hash=$(file_hash frontend/package.json)
package_lock_hash=$(file_hash frontend/package-lock.json)
backend_hash=$(file_hash backend/package.json)
backend_lock_hash=$(file_hash backend/package-lock.json)
while sleep 1
do
    new_package_hash=$(file_hash frontend/package.json)
    new_package_lock_hash=$(file_hash frontend/package-lock.json)
    new_backend_hash=$(file_hash backend/package.json)
    new_backend_lock_hash=$(file_hash backend/package-lock.json)
    
    if [ "$package_hash" != "$new_package_hash" ] || [ "$package_lock_hash" != "$new_package_lock_hash" ]
    then
        echo "running frontend npm install..."
        cd frontend
        npm install | tee ../logs/frontend_installer.log
        cd ..
        new_package_hash=$(file_hash frontend/package.json)
        new_package_lock_hash=$(file_hash frontend/package-lock.json)
    fi

    if [ "$backend_lock_hash" != "$new_backend_lock_hash" ] || [ "$backend_hash" != "$new_backend_hash" ]
    then
        echo "running backend npm install..."
        cd backend
        npm install | tee ../logs/backend_installer.log
        cd ..
        new_backend_hash=$(file_hash backend/package.json)
        new_backend_lock_hash=$(file_hash backend/package-lock.json)
    fi

    package_hash=$new_package_hash
    package_lock_hash=$new_package_lock_hash
    backend_hash=$new_backend_hash
    backend_lock_hash=$new_backend_lock_hash

done )  & CONTINUOUS_INSTALL_PID=$!

# Start server process once initial build finishes  
cd frontend
( npm run start | tee ../logs/frontend_runner.log ) & SERVER_PID=$!

cd ../backend
( npm run start | tee ../logs/backend_runner.log ) & BACKEND_SERVER_PID=$!

# Handle application background process exiting
wait $CONTINUOUS_INSTALL_PID $SERVER_PID $BACKEND_SERVER_PID
EXIT_CODE=$?
echo "application exited with exit code $EXIT_CODE..."
