# be-bayarin: Microservices Backend

`be-bayarin` adalah proyek backend yang mengimplementasikan arsitektur microservices menggunakan NestJS, TypeScript, RabbitMQ sebagai message broker, Redis untuk caching, dan Prisma sebagai ORM.

## Arsitektur Aplikasi

Proyek ini dirancang dengan pendekatan microservices untuk memisahkan tanggung jawab dan meningkatkan skalabilitas. Terdiri dari dua komponen utama:

1.  **`be-core` (API Gateway / Main Application)**:
    *   Berfungsi sebagai API Gateway utama yang menerima semua permintaan HTTP dari frontend.
    *   Menangani operasi `GET` (misalnya, `findAll`, `findOne`) secara langsung, berinterinteraksi dengan database melalui Prisma dan memanfaatkan Redis untuk caching guna meningkatkan performa.
    *   Untuk operasi modifikasi data (`POST`, `PATCH`, `DELETE`), `be-core` bertindak sebagai klien RabbitMQ. Ia mengirimkan pesan RPC (Remote Procedure Call) ke worker melalui RabbitMQ dan menunggu respons.
    *   Dilengkapi dengan exception filter global untuk menangani error secara terpusat, termasuk `RpcException` dari worker dan `TimeoutError` jika worker tidak merespons.

2.  **`worker` (Microservice)**:
    *   Berfungsi sebagai microservice yang mendengarkan pesan RPC dari RabbitMQ.
    *   Memproses operasi modifikasi data (`create_company`, `update_company`, `delete_company`) yang diterima dari `be-core`.
    *   Berinteraksi langsung dengan database melalui Prisma untuk melakukan operasi CRUD.
    *   Bertanggung jawab untuk membersihkan cache Redis yang relevan setelah modifikasi data.
    *   Melemparkan `RpcException` jika terjadi error selama pemrosesan, yang kemudian akan ditangkap oleh `be-core`.

**RabbitMQ** digunakan sebagai message broker untuk komunikasi asinkron dan pola request-response (RPC) antara `be-core` dan `worker`. Antrean RabbitMQ dikonfigurasi sebagai `durable: true` untuk memastikan persistensi pesan dan antrean.

**Redis** digunakan oleh `be-core` untuk caching data `GET` guna mengurangi beban database dan mempercepat respons.

**Prisma** digunakan sebagai Object-Relational Mapper (ORM) untuk interaksi dengan database di kedua komponen.

## Teknologi Utama

*   **Backend Framework**: [NestJS](https://nestjs.com/) (TypeScript)
*   **Message Broker**: [RabbitMQ](https://www.rabbitmq.com/)
*   **Caching**: [Redis](https://redis.io/)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Database**: (Contoh: PostgreSQL, MySQL - sesuai konfigurasi Prisma Anda)

## Struktur Proyek

```
be-bayarin/
├── be-core/             # Aplikasi utama / API Gateway
│   ├── src/             # Kode sumber be-core
│   │   ├── modules/     # Modul aplikasi (e.g., auth, company)
│   │   ├── infra/       # Infrastruktur (prisma, redis, logger)
│   │   └── ...
│   ├── .env.example     # Contoh konfigurasi environment
│   ├── package.json     # Dependensi dan script be-core
│   └── ...
├── worker/              # Microservice worker
│   ├── src/             # Kode sumber worker
│   │   ├── worker/      # Service worker (e.g., company.worker.service)
│   │   ├── infra/       # Infrastruktur (prisma, redis, logger)
│   │   └── ...
│   ├── .env.example     # Contoh konfigurasi environment
│   ├── package.json     # Dependensi dan script worker
│   └── ...
├── .vscode/             # Konfigurasi VS Code (termasuk debugger)
│   └── launch.json
├── README.md            # Dokumentasi proyek ini
└── ...
```

## Setup dan Instalasi

### Prasyarat

Pastikan Anda memiliki perangkat lunak berikut terinstal:

*   [Node.js](https://nodejs.org/en/) (v18 atau lebih baru direkomendasikan)
*   [npm](https://www.npmjs.com/) (biasanya terinstal dengan Node.js)
*   [Docker](https://www.docker.com/get-started) (untuk menjalankan RabbitMQ, Redis, dan Database)

### Langkah-langkah Instalasi

1.  **Clone Repositori:**
    ```bash
    git clone <URL_REPOSITORI_ANDA>
    cd be-bayarin
    ```

2.  **Instal Dependensi:**
    Instal dependensi untuk `be-core` dan `worker`.
    ```bash
    cd be-core
    npm install
    cd ../worker
    npm install
    cd .. # Kembali ke direktori root
    ```

3.  **Konfigurasi Environment Variables:**
    Buat file `.env` di dalam direktori `be-core/` dan `worker/` berdasarkan file `.env.example` yang tersedia.

    **`be-core/.env` dan `worker/.env`:**
    ```bash
    PORT=8000 # Untuk be-core
    DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public" # Sesuaikan dengan DB Anda
    JWT_SECRET="token"
    REDIS_URL=redis://localhost:6379
    RABBITMQ_URL=amqp://localhost:5672
    RABBITMQ_RPC_QUEUE_NAME=worker_rpc_queue
    ```
    *Pastikan `RABBITMQ_URL` dan `RABBITMQ_RPC_QUEUE_NAME` konsisten di kedua file `.env`.*

4.  **Setup Database (Prisma):**
    Pastikan database Anda berjalan (misalnya, PostgreSQL via Docker). Kemudian, jalankan migrasi Prisma.
    ```bash
    cd be-core
    npx prisma migrate dev --name init # Sesuaikan nama migrasi jika perlu
    # Jika worker juga perlu akses Prisma Client, pastikan skema sudah di-generate:
    # cd ../worker
    # npx prisma generate
    cd .. # Kembali ke direktori root
    ```

## Menjalankan Aplikasi

Pastikan Docker Anda berjalan untuk menjalankan RabbitMQ, Redis, dan Database.

1.  **Jalankan RabbitMQ dan Redis (menggunakan Docker):**
    ```bash
    docker run -d --hostname my-rabbit --name some-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management
    docker run -d --name some-redis -p 6379:6379 redis
    # Untuk database, gunakan image Docker yang sesuai (misal: postgres)
    ```

2.  **Jalankan Worker:**
    Buka terminal baru, navigasi ke direktori `worker`, dan jalankan:
    ```bash
    cd worker
    npm run start:worker
    ```
    Anda akan melihat log seperti `Worker is listening on queue: worker_rpc_queue`.

3.  **Jalankan `be-core`:**
    Buka terminal baru, navigasi ke direktori `be-core`, dan jalankan:
    ```bash
    cd be-core
    npm run start:dev # Untuk development dengan hot-reload
    # atau npm run start:prod untuk production
    ```
    Anda akan melihat log bahwa `be-core` berhasil dimulai (misalnya, `🚀 Server ready on http://localhost:8000`).

## API Endpoints (Contoh untuk Modul Company)

Berikut adalah contoh endpoint untuk modul `Company`:

*   **GET /company**
    *   **Deskripsi**: Mengambil daftar semua perusahaan.
    *   **Penanganan**: Langsung oleh `be-core` (menggunakan Redis cache dan Prisma).
    *   **Contoh Respon Sukses**:
        ```json
        {
          "data": [
            { "id": 1, "name": "Company A", "address": "..." }
          ],
          "success": true,
          "message": "List of companies retrieved successfully!"
        }
        ```

*   **GET /company/:id**
    *   **Deskripsi**: Mengambil detail perusahaan berdasarkan ID.
    *   **Penanganan**: Langsung oleh `be-core` (menggunakan Redis cache dan Prisma).

*   **POST /company**
    *   **Deskripsi**: Membuat perusahaan baru.
    *   **Penanganan**: `be-core` mengirim pesan RPC ke `worker` melalui RabbitMQ.
    *   **Body Request (JSON)**:
        ```json
        {
          "name": "New Company Name",
          "emailAdmin": "admin@example.com",
          "officePhone": "+628123456789",
          "address": "Jl. Contoh No. 123"
        }
        ```

*   **PATCH /company/:id**
    *   **Deskripsi**: Memperbarui detail perusahaan berdasarkan ID.
    *   **Penanganan**: `be-core` mengirim pesan RPC ke `worker` melalui RabbitMQ.
    *   **Body Request (JSON)**:
        ```json
        {
          "name": "Updated Company Name"
        }
        ```

*   **DELETE /company/:id**
    *   **Deskripsi**: Menghapus perusahaan berdasarkan ID.
    *   **Penanganan**: `be-core` mengirim pesan RPC ke `worker` melalui RabbitMQ.

## Debugging dengan VS Code

Proyek ini dilengkapi dengan konfigurasi debugging untuk VS Code. Anda dapat menempatkan breakpoint di kode Anda dan menjalankan aplikasi dalam mode debug.

1.  Buka proyek di VS Code.
2.  Pergi ke tab **Run and Debug** (ikon serangga di sidebar kiri).
3.  Pilih salah satu konfigurasi dari dropdown:
    *   `Launch be-core`
    *   `Launch worker`
4.  Klik tombol hijau **Start Debugging**.

Anda dapat menjalankan kedua konfigurasi secara bersamaan untuk debugging end-to-end.