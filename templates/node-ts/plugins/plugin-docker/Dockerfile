FROM node:10.15.0 as build-stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn
COPY . .
RUN npm run build

FROM node:10.15.0-alpine as prod
WORKDIR /usr/src/app
COPY --from=build-stage /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build-stage /usr/src/app/dist /usr/src/app/dist
CMD [ "node","./dist/index.js" ]