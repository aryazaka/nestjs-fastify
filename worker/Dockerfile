FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate
# build worker
RUN npm run build

# jalankan worker script
CMD ["npm", "run", "start:prod"]
