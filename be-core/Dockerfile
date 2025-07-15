# pakai base image Node.js 22 Alpine
FROM node:22-alpine

# buat direktori kerja
WORKDIR /app

# copy file dependency list
COPY package*.json ./

# install dependencies (hanya production dep kalau sudah build)
RUN npm install

# copy semua source code
COPY . .

RUN npx prisma generate
# build aplikasi
RUN npm run build

# expose port NestJS misalnya 3000
EXPOSE 3000

# jalankan production start script
CMD ["npm", "run", "start:prod"]
