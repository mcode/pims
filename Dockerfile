FROM node:14-alpine
ENV NODE_ENV production

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

CMD ./dockerRunnerProd.sh