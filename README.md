# Pharmacy Information Management System

## Setup

The application is divided into a frontend and backend service. For an initial setup run `npm install` in both the frontend and backend subdirectories. This will install the dependencies required for each of the services.

## Running backend and frontend

Run the individual services by either launching both of them independently or using pm2 innately through Docker.

### Running independently

To run them individually you will need to open a terminal window in each of the frontend and backend subdirectories. From there you will need to run `npm start` in each of the terminal windows.

By default, the frontend will start on port 5050 (defined in `frontend/.env`) and the backend will start on port 5051 (defined in `backend/env.json`).

To configure the frontend to start on different port, set the `PORT` environment variable to the desired port; e.g. `PORT=5050 npm start`, or create a `frontend/.env.local` to override `PORT`.

To configure the backend to start on a different port, set the `BACKEND_PORT` environment variable to the desired port; e.g.  
`BACKEND_PORT=5051 npm start`.

These environment variables, and others, can also be set in the pm2 configuration file for the individual service entries.

Once running both the frontend and backend systems, open [http://localhost:5050](http://localhost:5050) in your browser to view the application.

### Using pm2

`pm2` is used in our [Dockerized REMS Integration Prototype setup](https://github.com/mcode/rems-setup/blob/main/DeveloperSetupGuide.md) for production to start both the frontend and the backend services. It is not used in development due to a bug with hot-reloading code changes in the two services.

## Version

This application requires node.js v20.0 or greater. Using [`nvm`](https://github.com/nvm-sh/nvm) is optional, but easier when managing different node.js versions.

- `nvm install 20`
- `nvm use 20` or `nvm use default 20`, as most of the REMS Integration Prototype repositories are compatible with node v20.0.
