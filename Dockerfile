FROM node:lts-alpine
RUN mkdir -p /home/node/stormnode/node_modules && chown -R node:node /home/node/stormnode
WORKDIR /home/node/stormnode
USER node
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node storm_modules storm_modules
COPY --chown=node:node stormnode.js stormnode.js
ENTRYPOINT [ "./stormnode.js" ]
