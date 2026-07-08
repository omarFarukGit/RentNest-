# 📖 API Documentation

**Base URL**

```text
http://localhost:5000/api
```

---

## 📬 Postman Collection

Import the Postman Collection to test all available API endpoints.

👉 **Download Collection:** [RentNest.postman_collection.json](./RentNest.postman_collection.json)

## Authentication

Most endpoints require a JWT access token.

```http
Authorization: Bearer <your_access_token>
```

---

# User APIs

| Method | Endpoint          | Description                  | Auth |
| ------ | ----------------- | ---------------------------- | ---- |
| POST   | `/users/register` | Register a new user          | ❌   |
| GET    | `/users/me`       | Get logged-in user's profile | ✅   |

---

# Authentication APIs

| Method | Endpoint              | Description               | Auth |
| ------ | --------------------- | ------------------------- | ---- |
| POST   | `/auth/login`         | Login user                | ❌   |
| POST   | `/auth/refresh-token` | Generate new access token | ❌   |

---

# Property APIs

## Public

| Method | Endpoint          | Description         | Auth |
| ------ | ----------------- | ------------------- | ---- |
| GET    | `/properties`     | Get all properties  | ❌   |
| GET    | `/properties/:id` | Get single property | ❌   |

### Query Parameters

| Parameter    | Description              |
| ------------ | ------------------------ |
| search       | Search by title/location |
| category     | Filter by category       |
| minPrice     | Minimum price            |
| maxPrice     | Maximum price            |
| bedrooms     | Number of bedrooms       |
| bathrooms    | Number of bathrooms      |
| minSize      | Minimum size             |
| maxSize      | Maximum size             |
| availability | Property availability    |
| sortBy       | Sort field               |
| sortOrder    | asc / desc               |
| page         | Current page             |
| limit        | Data per page            |

---

## Landlord

| Method | Endpoint                              | Description             | Auth |
| ------ | ------------------------------------- | ----------------------- | ---- |
| POST   | `/properties`                         | Create property         | ✅   |
| GET    | `/properties/landlord`                | Get landlord properties | ✅   |
| PATCH  | `/properties/:id`                     | Update property         | ✅   |
| PATCH  | `/properties/:id/toggle-availability` | Toggle availability     | ✅   |
| DELETE | `/properties/:id`                     | Delete property         | ✅   |

---

# Category APIs

## Public

| Method | Endpoint          | Description         |
| ------ | ----------------- | ------------------- |
| GET    | `/categories`     | Get all categories  |
| GET    | `/categories/:id` | Get single category |

---

## Admin

| Method | Endpoint          | Description     | Auth |
| ------ | ----------------- | --------------- | ---- |
| POST   | `/categories`     | Create category | ✅   |
| PUT    | `/categories/:id` | Update category | ✅   |
| DELETE | `/categories/:id` | Delete category | ✅   |

---

# Rental Request APIs

## Tenant

| Method | Endpoint               | Description            | Auth |
| ------ | ---------------------- | ---------------------- | ---- |
| POST   | `/rentals`             | Create rental request  | ✅   |
| GET    | `/rentals/my-requests` | Get my rental requests | ✅   |
| PATCH  | `/rentals/:id/cancel`  | Cancel rental request  | ✅   |

### Query Parameters

- status
- page
- limit

---

## Landlord

| Method | Endpoint              | Description          | Auth |
| ------ | --------------------- | -------------------- | ---- |
| GET    | `/rentals/landlord`   | Get rental requests  | ✅   |
| PATCH  | `/rentals/:id/status` | Update rental status | ✅   |

---

## Common

| Method | Endpoint             | Description               | Auth |
| ------ | -------------------- | ------------------------- | ---- |
| GET    | `/rentals/:id`       | Get single rental request | ✅   |
| GET    | `/rentals/stats/all` | Rental statistics         | ✅   |

---

# Payment APIs

| Method | Endpoint              | Description         | Auth |
| ------ | --------------------- | ------------------- | ---- |
| POST   | `/payments/create`    | Create payment      | ✅   |
| GET    | `/payments`           | Get payment history | ✅   |
| GET    | `/payments/:id`       | Get single payment  | ✅   |
| GET    | `/payments/stats/all` | Payment statistics  | ✅   |

---

# Review APIs

| Method | Endpoint                        | Description          | Auth |
| ------ | ------------------------------- | -------------------- | ---- |
| POST   | `/reviews`                      | Create review        | ✅   |
| GET    | `/reviews/property/:propertyId` | Get property reviews | ❌   |

---

# Admin APIs

## Properties

| Method | Endpoint                | Description        |
| ------ | ----------------------- | ------------------ |
| GET    | `/admin/properties`     | Get all properties |
| PATCH  | `/admin/properties/:id` | Update property    |
| DELETE | `/admin/properties/:id` | Delete property    |

---

## Users

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| GET    | `/admin/users`     | Get all users      |
| GET    | `/admin/users/:id` | Get single user    |
| PATCH  | `/admin/users/:id` | Update user status |

---

## Rentals

| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| GET    | `/admin/rentals`            | Get all rentals      |
| GET    | `/admin/rentals/:id`        | Get single rental    |
| PATCH  | `/admin/rentals/:id/status` | Update rental status |
| DELETE | `/admin/rentals/:id`        | Delete rental        |

---

# Response Format

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

---

# Error Response

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": {}
}
```
