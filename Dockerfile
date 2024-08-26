FROM node:14-alpine

WORKDIR /home/node/app
COPY --chown=node:node . .
WORKDIR /home/node/app/backend
RUN npm install
WORKDIR /home/node/app/frontend
RUN npm install
WORKDIR /home/node/app

RUN npm install pm2 -g

EXPOSE 5050
EXPOSE 5051
RUN apk update 
RUN apk upgrade
RUN apk search curl 
RUN apk add curl

HEALTHCHECK --interval=60s --timeout=10m --retries=10 CMD curl --fail (curl --fail http://localhost:5051/doctorOrders/api/getRx/pending && curl --fail http://localhost:5050) || exit 1

CMD [ "pm2-docker", "pm2.config.js" ]