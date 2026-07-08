# 🏠 RentNest - Rental Property Management System

**A secure and modern Rental Property Management REST API built with Express.js, TypeScript, Prisma ORM, PostgreSQL, and JWT Authentication.**

RentNest simplifies the rental process by connecting **Tenants**, **Landlords**, and **Admins** on a single platform. Landlords can publish and manage rental properties, tenants can search properties and submit rental requests, and admins can manage users, categories, properties, and rental activities.

---

## 🔗 Live Linksy

* **Backend API:** `https://your-backend-url.vercel.app`
* **API Documentation:** [API Documentation](./API_Documentation.md)
* **Postman Collection:** [RentNest.postman_collection.json](./RentNest.postman_collection.json)
* **Database Design ERD :** [RentNest ERD](https://drawsql.app/teams/omarfruk/diagrams/rentnest)

---

# ✨ Features

### Tenant
- Register & Login
- View profile
- Browse properties
- Create rental requests
- Cancel pending requests
- View own rental requests
- Make payments
- Leave reviews

### Landlord
- Create, update and delete properties
- Toggle property availability
- View own properties
- View rental requests
- Approve/Reject rental requests

### Admin
- Manage users
- Manage properties
- Manage rental requests
- Manage categories

## 👤 Authentication & Authorization

* JWT Authentication
* Refresh Token Support
* Role-Based Authorization
* Secure Password Hashing using bcrypt
* Protected Routes

---

## 🏡 Property Management

* Create Property (Landlord)
* Update Property
* Delete Property
* Toggle Availability
* Get All Properties
* Get Property Details
* Search & Filtering
* Pagination
* Sorting

---

## 📂 Category Management

* Create Category
* Update Category
* Delete Category
* Get All Categories
* Get Category Details

---

## 📄 Rental Request System

### Tenant

* Submit Rental Request
* View Own Rental Requests
* Cancel Pending Request
* View Request Details

### Landlord

* View Property Rental Requests
* Approve Request
* Reject Request

### Statistics

* Rental Statistics
* Rental Status Tracking

---

## 💳 Payment System

* Stripe Payment Integration
* Create Payment Session
* Payment History
* Payment Details
* Payment Statistics

---

## ⭐ Review System

* Add Property Review
* Get Property Reviews

---

## 👨‍💼 Admin Dashboard

* Manage Users
* Manage Properties
* Manage Rental Requests
* Update User Status
* Moderate Platform Data

---

# 👥 User Roles

| Role         | Permissions                                                             |
| ------------ | ----------------------------------------------------------------------- |
| **Tenant**   | Browse properties, submit rental requests, make payments, leave reviews |
| **Landlord** | Manage properties, approve/reject requests                              |
| **Admin**    | Full system management                                                  |

---

# 🛠️ Tech Stack

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* PostgreSQL
* Prisma ORM

### Authentication

* JWT
* bcrypt

### Payment Gateway

* Stripe

### Documentation

* Postman

---

# 📂 Project Structure

```bash
src
│
├── app
│   ├── modules
│   ├── middlewares
│   ├── routes
│   ├── utils
│   ├── config
│   └── interfaces
│
├── prisma
├── app.ts
└── server.ts
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/your-username/RentNest.git
```

Move to project

```bash
cd RentNest
```

Install dependencies

```bash
npm install
```

Create environment file

```env
PORT=5000

DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

BCRYPT_SALT_ROUNDS=10

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

CLIENT_URL=
```

Generate Prisma Client

```bash
npx prisma generate
```

Run Migration

```bash
npx prisma migrate dev
```

Start Development Server

```bash
npm run dev
```

---

# 📖 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

```
Authorization: Bearer <access_token>
```

### Postman Collection

Import the Postman Collection to test all endpoints.

📥 **Collection:** [RentNest.postman_collection.json](./RentNest.postman_collection.json)

---

# 📌 API Modules

## User

* Register User
* Get My Profile

---

## Authentication

* Login
* Refresh Token

---

## Property

### Public

* Get All Properties
* Get Property Details

### Landlord

* Create Property
* Update Property
* Delete Property
* Toggle Availability
* Get Own Properties

---

## Category

* Get All Categories
* Get Category Details
* Create Category
* Update Category
* Delete Category

---

## Rental Requests

### Tenant

* Create Request
* Get My Requests
* Cancel Request

### Landlord

* Get Requests
* Update Request Status

### Common

* Get Single Request
* Rental Statistics

---

## Payments

* Create Payment
* Get Payment History
* Get Payment Details
* Payment Statistics

---

## Reviews

* Create Review
* Get Property Reviews

---

## Admin

### Users

* Get All Users
* Get Single User
* Update User Status

### Properties

* Get All Properties
* Update Property
* Delete Property

### Rentals

* Get All Rentals
* Get Single Rental
* Update Rental Status
* Delete Rental

---

# 📊 Database Models

* User
* Category
* Property
* RentalRequest
* Payment
* Review

---

# 🔒 Security Features

* JWT Authentication
* Password Hashing
* Role-Based Authorization
* Request Validation
* Global Error Handling
* CORS Protection

---

# 📦 Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
```

---

# 👨‍💻 Author

**MD Omar faruk**

Junior Full Stack Developer

GitHub: https://github.com/oamrFarukGit

LinkedIn: https://linkedin.com/in/omarfarukdev

---

# 📄 License

This project is licensed under the MIT License.
