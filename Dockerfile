# OVERVIEW: This is the Dockerfile for a multi-stage build of the CDS Authoring
# Tool. A multi-stage approach was used to keep the overall image size low by
# including only the layers needed at runtime in the final image. For more
# info see: https://docs.docker.com/develop/develop-images/multistage-build/

###############################################################################
# STAGE 0: base
# - Setup base image from which most others derive. This allows for a single
#   place to declare the versioned node image we use and any other commands
#   common to all (or most?) environments.
###############################################################################

FROM node:18-alpine as base
ENV NODE_ENV production
# ADD https://gitlab.mitre.org/mitre-scripts/mitre-pki/raw/master/os_scripts/install_certs.sh /tmp/install_certs.sh
# RUN chmod a+x /tmp/install_certs.sh && /tmp/install_certs.sh && rm /tmp/install_certs.sh

# RUN apk update
# RUN apk upgrade openssl
# First copy just the package.json, package-lock.json, and local dependencies so that
# if they have not changed, we can use cached node_modules instead of
# redownloading them all.
COPY ./ /usr/src/app/
WORKDIR /usr/src/app/backend



RUN npm install

RUN ls -la 



WORKDIR /usr/src/app/frontend
RUN npm install


RUN npm install -g pm2@4.4.1
WORKDIR /usr/src/app
RUN chown -R node:node .
ENV PORT 5050

EXPOSE 5050
EXPOSE 5051

USER node


CMD [ "pm2-docker", "pm2.config.js" ]