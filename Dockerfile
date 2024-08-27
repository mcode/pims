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

HEALTHCHECK --interval=30s --start-period=15s --timeout=10m --retries=10 CMD (wget --no-verbose --tries=1 --spider http://localhost:5051/doctorOrders/api/getRx/pending && wget --no-verbose --tries=1 --spider http://localhost:5050) || exit 1

CMD [ "pm2-docker", "pm2.config.js" ]