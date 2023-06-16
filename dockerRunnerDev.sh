#!/bin/sh

# Handle closing application on signal interrupt (ctrl + c)
trap 'kill $CONTINUOUS_INSTALL_PID $SERVER_PID; gradle --stop; exit' INT

mkdir logs 
# Reset log file content for new application boot
echo "*** Logs for continuous installer ***" > ./frontend/logs/installer.log
echo "*** Logs for 'npm run start' ***" > ./frontent/logs/runner.log

echo "*** Logs for continuous installer ***" > ./backend/logs/installer.log
echo "*** Logs for 'npm run start' ***" > ./backend/logs/runner.log

# Print that the application is starting in watch mode
echo "starting application in watch mode..."

# Start the continious build listener process
echo "starting continuous installer..."

cd frontend
npm install | tee ./logs/installer.log
cd ../backend
npm install | tee ./logs/installer.log
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
        echo "running npm install..."
        cd frontend
        npm install | tee ./logs/installer.log
        cd ../backend
        npm install | tee ./logs/installer.log
        cd ..
        pm2-docker pm2.config.dev.js 
    fi

    package_modify_time=$new_package_modify_time
    package_lock_modify_time=$new_package_lock_modify_time
    backend_modify_time=$new_backend_modify_time
    backend_lock_modify_time=$new_backend_lock_modify_time

done )  & CONTINUOUS_INSTALL_PID=$!

# Start server process once initial build finishes  
( pm2-docker pm2.config.js ) & SERVER_PID=$!

# Handle application background process exiting
wait $CONTINUOUS_INSTALL_PID $SERVER_PID
EXIT_CODE=$?
echo "application exited with exit code $EXIT_CODE..."

