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

The frontend displays pending, approved, and picked up proprietary doctor orders at [http://localhost:5050/DoctorOrders](http://localhost:5050/DoctorOrders). While there is a login page at [http://localhost:5050](http://localhost:5050) for a dummy user, there is no user authentication or authorization system.

## Environment Variables

The PIMS system uses environment variables to configure both the frontend and backend services.

### Frontend Environment Variables

The frontend environment variables are configured in `frontend/.env`:

| Variable Name | Default Value | Description |
| ------------- | ------------- | ----------- |
| PORT | `5050` | The port that the frontend server runs on. Change if there are conflicts with port usage. |
| REACT_APP_PIMS_BACKEND_PORT | `5051` | The port that the backend server runs on. Must match the backend's `BACKEND_PORT` setting. |

To override defaults, either:
- Start the app with environment variables: `PORT=5050 npm start`
- Create a `frontend/.env.local` file with the desired values

### Backend Environment Variables

The backend environment variables are configured in `backend/env.json`:

| Variable Name | Default Value | Description |
| ------------- | ------------- | ----------- |
| BACKEND_PORT | `5051` | The port that the backend server runs on. Change if there are conflicts with port usage. |
| ALLOWED_ORIGIN | `*` | CORS allowed origins. Specify domains that are allowed to access the backend API. |
| MONGO_USERNAME | `pims-user` | Username for MongoDB authentication. Should match the user created during MongoDB setup. |
| MONGO_PASSWORD | `pims-pass` | Password for MongoDB authentication. Should match the password created during MongoDB setup. |
| MONGO_URL | `mongodb://localhost:27017/pims` | MongoDB connection URL. Update if using a different host, port, or database name. |
| AUTH_SOURCE | `pims` | MongoDB authentication source database name. |
| HTTPS_KEY_PATH | `server.key` | Path to the HTTPS private key file. Required only if `USE_HTTPS` is true. |
| HTTPS_CERT_PATH | `server.cert` | Path to the HTTPS certificate file. Required only if `USE_HTTPS` is true. |
| USE_HTTPS | `false` | Set to `true` to enable HTTPS. Ensure valid certificate and key paths are configured. |
| EHR_RXFILL_URL | `http://localhost:8080/test-ehr/ncpdp/script` | URL endpoint for sending RxFill messages to the EHR system. |
| USE_INTERMEDIARY | `true` | Set to `true` to route ETASU checks through the REMS intermediary instead of directly to REMS admin. |
| INTERMEDIARY_FHIR_URL | `http://localhost:3003/4_0_0` | Base URL of the REMS intermediary FHIR server. Used when `USE_INTERMEDIARY` is true. |
| REMS_ADMIN_NCPDP | `http://localhost:8090/ncpdp/script` | URL endpoint for sending NCPDP Script messages directly to REMS admin. |
| INTERMEDIARY_URL | `http://localhost:3003` | Base URL of the REMS intermediary. Used when `USE_INTERMEDIARY` is true to route NCPDP Script and RxFill messages. |
| EHR_NCPDP_URL | `http://localhost:8080/ncpdp/script` | URL endpoint for sending NCPDP Script messages directly to the EHR system. Used when `USE_INTERMEDIARY` is false. |

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

# Data Rights

<div style="text-align:center">
<b>NOTICE</b>
</div>

This (software/technical data) was produced for the U. S. Government under Contract Number 75FCMC18D0047/75FCMC23D0004, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.


No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.


For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA 22102-7539, (703) 983-6000.

<div style="text-align:center">
<b>&copy;2025 The MITRE Corporation.</b>
</div>

<br />

Licensed under the Apache License, Version 2.0 (the "License"); use of this repository is permitted in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.