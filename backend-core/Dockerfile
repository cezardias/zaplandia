FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache python3 make g++ && npm install

COPY . .

RUN rm -rf dist && npx nest build && ls -R dist/comms

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
