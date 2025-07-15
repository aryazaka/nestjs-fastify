# pakai base image Node.js 22 Alpine
FROM node:22-alpine

# buat direktori kerja
WORKDIR /app

# copy file dependency list
COPY package*.json ./

# install dependencies (hanya production dep kalau sudah build)
RUN npm install

RUN npx prisma generate

# copy semua source code
COPY . .

# build aplikasi
RUN npm run build

# expose port NestJS misalnya 3000
EXPOSE 3000

# jalankan production start script
CMD ["npm", "run", "start:prod"]
