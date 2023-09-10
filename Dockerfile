FROM node:19-alpine3.16

WORKDIR /usr/src/app

COPY api/ .

RUN npm install -g nodemon

EXPOSE 3000