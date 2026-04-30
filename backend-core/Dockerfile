FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache python3 make g++ && npm install

COPY . .

RUN npx nest build

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
