FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# build worker
RUN npm run build

# jalankan worker script
CMD ["npm", "run", "start:prod"]
