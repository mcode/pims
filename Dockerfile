FROM node:14-alpine
ENV NODE_ENV production

WORKDIR /home/node/app
COPY --chown=node:node . .
RUN npm install -g typescript

WORKDIR /home/node/app/backend
RUN npm install
RUN npm link typescript

WORKDIR /home/node/app/frontend
RUN npm install
RUN npm link typescript

WORKDIR /home/node/app

# RUN npm install pm2 -g

EXPOSE 5050
EXPOSE 5051

CMD ./dockerRunnerProd.sh