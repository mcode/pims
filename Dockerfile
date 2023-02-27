FROM node:14-alpine
WORKDIR /home/node/app/pims
COPY --chown=node:node . .
RUN npm install
EXPOSE 5050
EXPOSE 5051
CMD npm run start