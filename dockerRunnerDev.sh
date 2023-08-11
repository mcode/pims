#!/bin/sh

# Handle closing application on signal interrupt (ctrl + c)
trap 'kill $CONTINUOUS_INSTALL_PID $SERVER_PID $BACKEND_SERVER_PID; exit' INT

mkdir logs 
# Reset log file content for new application boot
echo "*** Logs for continuous frontend installer ***" > ./frontend/logs/installer.log
echo "*** Logs for frontend 'npm run start' ***" > ./frontent/logs/runner.log

echo "*** Logs for continuous backend installer ***" > ./backend/logs/installer.log
echo "*** Logs for backend 'npm run start' ***" > ./backend/logs/runner.log

# Print that the application is starting in watch mode
echo "starting application in watch mode..."

# Start the continious build listener process
echo "starting continuous installers..."

cd frontend
npm install | tee ./frontend/logs/installer.log
cd ../backend
npm install | tee ./backend/logs/installer.log
cd ..

( package_modify_time=$(stat -c %Y frontend/package.json)
package_lock_modify_time=$(stat -c %Y frontend/package-lock.json)
backend_modify_time=$(stat -c %Y backend/package.json)
backend_lock_modify_time=$(stat -c %Y backend/package-lock.json)
while sleep 1
do
    new_package_modify_time=$(stat -c %Y frontend/package.json)
    new_package_lock_modify_time=$(stat -c %Y frontend/package-lock.json)
    new_backend_modify_time=$(stat -c %Y backend/package.json)
    new_backend_lock_modify_time=$(stat -c %Y backend/package-lock.json)
    
    if [[ "$package_modify_time" != "$new_package_modify_time" ]] || [[ "$package_lock_modify_time" != "$new_package_lock_modify_time" ]] || [[ "$backend_lock_modify_time" != "$new_backend_lock_modify_time" ]]|| [[ "$backend_modify_time" != "$new_backend_modify_time" ]]
    then
        echo "running frontent npm install..."
        cd frontend
        npm install | tee ./logs/installer.log
        cd ..
    elif [[ "$backend_lock_modify_time" != "$new_backend_lock_modify_time" ]]|| [[ "$backend_modify_time" != "$new_backend_modify_time" ]]
    then
        echo "running backend npm install..."
        cd backend
        npm install | tee ./logs/installer.log
        cd ..
    fi

    package_modify_time=$new_package_modify_time
    package_lock_modify_time=$new_package_lock_modify_time
    backend_modify_time=$new_backend_modify_time
    backend_lock_modify_time=$new_backend_lock_modify_time

done )  & CONTINUOUS_INSTALL_PID=$!

# Start server process once initial build finishes  
cd frontend
( npm run start | tee ./frontent/logs/runner.log ) & SERVER_PID=$!

cd ../backend
( npm run start | tee ./backend/logs/runner.log ) & BACKEND_SERVER_PID=$!

# Handle application background process exiting
wait $CONTINUOUS_INSTALL_PID $SERVER_PID $BACKEND_SERVER_PID
EXIT_CODE=$?
echo "application exited with exit code $EXIT_CODE..."

