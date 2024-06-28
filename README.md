# Pharmacy Information Management System

## Overview of repository

The Pharmacy Information Management System (PIMS) is a mock pharmacy system written in TypeScript/JavaScript/MongoDB that handles FHIR R4 (4.0.1), NCPDP Script, and proprietary data exchanges between the [request-generator](https://github.com/mcode/request-generator/), [test-ehr](https://github.com/mcode/test-ehr/), and [rems-admin](https://github.com/mcode/rems-admin/). This repository consists of a frontend service and a backend service.

### Backend overview

The backend consists of multiple HTTP GET, POST, PATCH, or DELETE routes, most of which are used to internally update the backend's database of proprietary doctor orders and NewRx's (based off NCPDP Script 2017071 NewRx), display doctor orders on the frontend, or handle converting FHIR and NCPDP Script.

- `/api/getRx/pending`, `/api/getRx/approved`, and `/api/getRx/pickedUp` are called by the PIMS frontend via GET. Each endpoint returns doctor orders with a "pending", "approved", or "picked up" dispense status.
- `/api/addRx` is called by the request-generator via POST. The endpoint parses an incoming NCPDP Script 2017071 XML NewRx, stores it, and returns an NCPDP Script 2017071 Status in XML.
- `/api/updateRx/:id` is called by the PIMS frontend via PATCH. The endpoint triggers the rems-admin's FHIR R4 GuidanceResponse POST Operation with a FHIR R4 Parameters to update a doctor order's dispense status to "approved".
- `/api/updateRx/:id/metRequirements` is called by the PIMS frontend to display a list of fulfilled and unfulfilled Elements to Assure Safe Use (ETASU).
- `/api/updateRx/:id/pickedUp` is called by the PIMS frontend to update a doctor order's dispense status to "picked up" and POST an NCPDP Script 2017071 RxFill created from the stored NCPDP Script 2017071 NewRx to the test-ehr to update the associated FHIR R4 MedicationDispense.
- `/api/deleteAll` is called by the PIMS frontend and request-generator via DELETE to delete all doctor orders (for development purposes).

### Frontend overview

The frontend displays pending, approved, and picked up proprietary doctor orders at [http://localhost:5050/DoctorOrders](http://localhost:5050/DoctorOrders). While there is a login page at [http://localhost:5050](http://localhost:5050/DoctorOrders) for a dummy user, there is no user authentication or authorization system.

## Setup

For an initial setup run `npm install` in both the frontend and backend subdirectories. This will install the dependencies required for each of the services.

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
