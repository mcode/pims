# Pharmacy Information Management System

### Setup 


The application is divided into a frontend and backend service. For an initial setup you will need to `run npm install` in both the frontend and backend subdirectories.  This will install the dependencies required for each of the services. 

### Running 

Running the individual services can be done by either launching both of them independently or using pm2. To run them individually you will need to open a terminal window in each of the frontend and backend subdirectories.  From there you will need to run `npm start` in each of the terminal windows.  

To run both the systems under pm2 you will first need to install it: `npm install pm2 -g`  After it is installed you can run both the systems with a single command `pm2 start pm2.config.json`.  This will start both the frontend and the backend services. 

By default, the frontend will start on port 3000 and the backend will start on port 5051.  To configure the frontend to start on different port set the PORT environment variable to the port you would like it to start on.  ex.  `PORT 5050 npm start`  To configure the backend to start on a different port set the BACKEND_PORT environment variable to the port you would like it to run on. 

These environment variables, and others , can also be set in the pm2 configuration file for the individula service entries. 

Once running both the frontend and backend systems open [http://localhost:5050](http://localhost:5050) in your browser to view the application. 

## Version
This application requires node v20.0 or greater.
