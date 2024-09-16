FROM node:14-alpine

WORKDIR /home/node/app
COPY --chown=node:node . .

WORKDIR /home/node/app/backend
RUN npm install

WORKDIR /home/node/app/frontend
RUN npm install

WORKDIR /home/node/app

EXPOSE 5050

HEALTHCHECK --interval=30s --start-period=60s --timeout=10m --retries=10 CMD wget --no-verbose --tries=1 --spider http://localhost:5051/doctorOrders/api/getRx/pending || exit 1

CMD ./dockerRunnerProd.sh
