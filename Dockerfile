FROM node:18-alpine

WORKDIR /home/node/app
COPY --chown=node:node . .

WORKDIR /home/node/app/backend
RUN npm install

WORKDIR /home/node/app/frontend
RUN npm install

WORKDIR /home/node/app

EXPOSE 5050
EXPOSE 5051

HEALTHCHECK --interval=45s --start-period=45s --timeout=10m --retries=10 CMD (wget --no-verbose --tries=1 --spider http://localhost:5051/doctorOrders/api/getRx/pending && wget --no-verbose --tries=1 --spider http://localhost:5050) || exit 1

CMD ./dockerRunnerProd.sh
