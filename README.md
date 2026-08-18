# CheckInly

A full-stack property listing and rental platform built with Node.js, Express.js, MongoDB, and EJS. CheckInly allows users to discover properties, search and filter listings, create and manage their own properties, upload images, and interact with listings through reviews.

The application follows an MVC architecture and uses server-side rendering with EJS. It includes authentication and authorization, MongoDB relationships, image uploads through Cloudinary, validation, sessions, pagination, search, filtering, and Docker-based deployment.

## Live Application

[CheckInly](https://checkinly.ashishtiwari.dev)

## Repository

[GitHub Repository](https://github.com/0xashishtiwari/checkInly)

---

# Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Technology Stack](#technology-stack)
* [Application Architecture](#application-architecture)
* [Project Structure](#project-structure)
* [Application Flow](#application-flow)
* [Authentication and Authorization](#authentication-and-authorization)
* [Database Design](#database-design)
* [Listings](#listings)
* [Reviews](#reviews)
* [Search and Filtering](#search-and-filtering)
* [Image Uploads](#image-uploads)
* [Validation](#validation)
* [Error Handling](#error-handling)
* [Pagination](#pagination)
* [Environment Variables](#environment-variables)
* [Local Development](#local-development)
* [Docker](#docker)
* [Deployment](#deployment)
* [Security Considerations](#security-considerations)
* [Future Improvements](#future-improvements)
* [Learning Outcomes](#learning-outcomes)
* [Author](#author)

---

# Overview

CheckInly is a property discovery and listing platform inspired by modern vacation-rental applications.

The primary goal of the project was to build a complete production-style web application rather than a simple CRUD application.

Users can:

* Browse properties
* Search for properties
* Filter properties by different parameters
* View detailed property pages
* Register and authenticate
* Create their own property listings
* Upload property images
* Edit their listings
* Delete their listings
* Leave reviews
* Delete reviews they created

The application also demonstrates how a traditional Node.js application can be containerized with Docker and deployed to Microsoft Azure.

---

# Features

## User Authentication

CheckInly provides session-based authentication.

Users can:

* Register an account
* Log in
* Log out
* Maintain an authenticated session
* Access protected routes
* Perform actions based on ownership

Authentication is implemented using Passport.js and Express sessions.

---

## Authorization

Authentication determines whether a user is logged in, while authorization determines whether the authenticated user is allowed to perform a particular operation.

For example:

```text
User A
  |
  +-- Owns Listing A
  |
  +-- Can edit Listing A
  |
  +-- Can delete Listing A
  |
  +-- Cannot edit Listing B
  |
  +-- Cannot delete Listing B
```

Ownership checks are performed before sensitive operations such as updating or deleting listings.

The same concept is applied to reviews.

A user can delete their own review but cannot delete another user's review.

---

# Listing Management

Authenticated users can create property listings containing information such as:

* Title
* Description
* Price
* Location
* Country
* Property image
* Other listing metadata

Users can also:

* View their listings
* Edit listings
* Delete listings
* Replace listing information
* Upload images

The listing lifecycle follows:

```text
Create
  |
  v
Validate
  |
  v
Upload Image
  |
  v
Store Image URL
  |
  v
Save Listing
  |
  v
Display Listing
```

---

# Search and Filtering

CheckInly includes a search and filtering system to make it easier to discover properties.

Users can search using listing-related information and apply filters such as:

* Location
* Country
* Minimum price
* Maximum price

The filtering parameters are passed through the query string.

For example:

```text
/listings?search=beach&location=goa&minPrice=1000&maxPrice=5000
```

This approach makes searches:

* Shareable
* Bookmarkable
* Compatible with browser navigation
* Easy to paginate
* Easy to extend with additional filters

---

# Pagination

The listings page supports pagination so that the application does not need to render every listing at once.

The basic process is:

```text
Request
  |
  v
Read page parameter
  |
  v
Calculate offset
  |
  v
Query required documents
  |
  v
Calculate total pages
  |
  v
Render current page
```

A typical query uses:

```text
skip = (page - 1) * limit
```

This allows the application to handle a larger number of listings without returning the entire collection in one request.

---

# Reviews

Users can leave reviews on listings.

A review contains information such as:

* Rating
* Comment
* Author
* Associated listing

The relationship between a listing and its reviews is represented using MongoDB references.

Conceptually:

```text
User
 |
 | creates
 v
Review
 |
 | belongs to
 v
Listing
```

When a listing is displayed, its reviews can be populated along with the associated user information.

---

# Database Design

CheckInly uses MongoDB with Mongoose as the ODM.

The primary entities are:

```text
User
Listing
Review
```

## User

The User model stores authentication-related information and user identity.

Conceptually:

```text
User
├── username
├── email
└── password/authentication data
```

---

## Listing

A listing represents a property available on the platform.

Conceptually:

```text
Listing
├── title
├── description
├── image
├── price
├── location
├── country
├── owner
└── reviews
```

The `owner` field references a User document.

Reviews are represented through references to Review documents.

---

## Review

A review represents feedback submitted by a user for a listing.

Conceptually:

```text
Review
├── comment
├── rating
├── author
└── listing
```

The `author` references a User.

The listing maintains a relationship with its reviews.

---

# Database Relationships

The main relationships can be represented as:

```text
              ┌──────────────┐
              │     User     │
              └──────┬───────┘
                     │
             owns    │
                     v
              ┌──────────────┐
              │    Listing   │
              └──────┬───────┘
                     │
              has    │
                     v
              ┌──────────────┐
              │    Review    │
              └──────┬───────┘
                     │
             written │ by
                     v
              ┌──────────────┐
              │     User     │
              └──────────────┘
```

Mongoose `populate()` is used where related documents need to be loaded.

---

# Application Architecture

CheckInly follows the MVC architecture.

```text
                         Client
                           |
                           v
                    Express Router
                           |
                           v
                       Middleware
                           |
                           v
                      Controller
                           |
                           v
                         Model
                           |
                           v
                       MongoDB
                           |
                           v
                      Controller
                           |
                           v
                      EJS View
                           |
                           v
                        Client
```

## Model

Models are responsible for defining the structure of MongoDB documents.

Example responsibilities:

* Schema definitions
* Validation rules
* Relationships
* Database interaction

---

## View

Views are implemented using EJS.

The views are responsible for rendering:

* Listing pages
* Forms
* Authentication pages
* Review sections
* Navigation
* Error pages
* Search results

EJS layouts and reusable partials help avoid duplicating HTML across pages.

---

## Controller

Controllers contain the application logic.

Examples include:

```text
Listing Controller
├── index
├── renderNewForm
├── createListing
├── showListing
├── renderEditForm
├── updateListing
└── deleteListing
```

Review controllers handle:

```text
Review Controller
├── createReview
└── deleteReview
```

User controllers handle authentication-related operations.

---

# Project Structure

```text
CheckInly/
│
├── controllers/
│   ├── listings.js
│   ├── reviews.js
│   └── users.js
│
├── models/
│   ├── listing.js
│   ├── review.js
│   └── user.js
│
├── routes/
│   ├── listing.js
│   ├── review.js
│   └── user.js
│
├── views/
│   ├── layouts/
│   │   └── boilerplate.ejs
│   │
│   ├── listings/
│   │   ├── index.ejs
│   │   ├── new.ejs
│   │   ├── show.ejs
│   │   └── edit.ejs
│   │
│   ├── users/
│   │   ├── login.ejs
│   │   └── signup.ejs
│   │
│   └── includes/
│       ├── navbar.ejs
│       ├── footer.ejs
│       └── flash.ejs
│
├── public/
│   ├── css/
│   ├── js/
│   └── images/
│
├── utils/
│
├── init/
│   └── data/
│
├── app.js
├── middleware.js
├── package.json
├── package-lock.json
├── Dockerfile
├── .dockerignore
├── .gitignore
└── README.md
```

---

# Routes

The application follows REST-style routing conventions.

## Listing Routes

| Method | Route                | Purpose             | Authentication |
| ------ | -------------------- | ------------------- | -------------- |
| GET    | `/listings`          | Display listings    | No             |
| GET    | `/listings/new`      | Display create form | Yes            |
| POST   | `/listings`          | Create listing      | Yes            |
| GET    | `/listings/:id`      | Display listing     | No             |
| GET    | `/listings/:id/edit` | Display edit form   | Yes + Owner    |
| PUT    | `/listings/:id`      | Update listing      | Yes + Owner    |
| DELETE | `/listings/:id`      | Delete listing      | Yes + Owner    |

---

## Review Routes

| Method | Route                             | Purpose       | Authentication |
| ------ | --------------------------------- | ------------- | -------------- |
| POST   | `/listings/:id/reviews`           | Create review | Yes            |
| DELETE | `/listings/:id/reviews/:reviewId` | Delete review | Yes + Author   |

---

## User Routes

| Method | Route     | Purpose           |
| ------ | --------- | ----------------- |
| GET    | `/signup` | Registration page |
| POST   | `/signup` | Create account    |
| GET    | `/login`  | Login page        |
| POST   | `/login`  | Authenticate user |
| GET    | `/logout` | Log out user      |

---

# Authentication and Authorization

Passport.js is used for authentication.

The authentication flow is:

```text
User
 |
 v
Login Form
 |
 v
POST /login
 |
 v
Passport Authentication
 |
 +---- Invalid credentials
 |          |
 |          v
 |      Error Message
 |
 +---- Valid credentials
            |
            v
       Create Session
            |
            v
       Redirect User
```

After authentication, the user remains logged in through the session.

Protected routes use middleware to ensure that the request comes from an authenticated user.

For ownership-sensitive operations, an additional authorization middleware checks whether the current user owns the requested resource.

---

# Middleware

Middleware is used throughout the application to keep common functionality separate from business logic.

Typical middleware responsibilities include:

* Authentication checks
* Authorization checks
* Request validation
* Session handling
* Flash messages
* Error handling
* Method overriding

A protected route can conceptually look like:

```text
Request
  |
  v
isLoggedIn
  |
  v
isOwner
  |
  v
Controller
```

This prevents unauthorized users from directly accessing protected endpoints.

---

# Image Uploads

Property images are stored using Cloudinary rather than directly inside the application server.

The upload process is:

```text
User selects image
       |
       v
Multipart form
       |
       v
Express middleware
       |
       v
Cloudinary
       |
       v
Image URL returned
       |
       v
MongoDB stores image metadata
```

The database stores the information necessary to reference the uploaded image, while the actual image is hosted by Cloudinary.

This approach avoids storing large binary files directly inside MongoDB or the application container.

---

# Validation

User-submitted data is validated before being persisted.

Validation is important because data received from the browser cannot be trusted.

The application validates information such as:

* Listing fields
* Review fields
* Required values
* Numeric values
* Rating ranges
* Other user-provided input

Joi is used for request validation.

The validation flow is:

```text
Client Input
    |
    v
Joi Validation
    |
    +---- Invalid
    |       |
    |       v
    |   Return Error
    |
    +---- Valid
            |
            v
        Controller
            |
            v
          Model
```

---

# Error Handling

The application uses centralized error-handling middleware to provide a consistent response when something goes wrong.

Errors can originate from:

* Invalid routes
* Invalid database IDs
* Validation failures
* Database operations
* Authentication
* Authorization
* File uploads
* Unexpected server errors

Instead of handling every error independently in every route, errors are passed to the centralized error handler.

Conceptually:

```text
Route
  |
  v
Controller
  |
  +---- Error
          |
          v
    next(error)
          |
          v
   Error Middleware
          |
          v
      Error View
```

---

# Flash Messages

Flash messages are used to communicate the result of user actions.

Examples include:

```text
Listing created successfully.
Listing updated successfully.
Listing deleted successfully.
Review added successfully.
You must be logged in.
You are not authorized to perform this action.
```

This provides immediate feedback after redirects.

---

# Search Implementation

Search parameters are read from the request query.

Example:

```text
GET /listings?search=mountain
```

The backend constructs a MongoDB query based on the supplied parameters.

Multiple filters can be combined.

For example:

```text
GET /listings
    ?search=house
    &location=Goa
    &country=India
    &minPrice=1000
    &maxPrice=5000
```

The resulting query only returns listings matching the selected criteria.

---

# Responsive UI

The frontend is built using:

* EJS
* HTML
* CSS
* Bootstrap
* JavaScript

The interface is designed to work across:

* Desktop
* Tablet
* Mobile

Reusable layout components are used for common UI elements such as:

* Navbar
* Footer
* Flash messages
* Page layout

---

# Loading Experience

The application includes client-side loading feedback for operations where the user may otherwise think the application has stopped responding.

The loading experience helps improve perceived performance during:

* Page navigation
* Form submissions
* Search operations
* Resource loading

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```env
ATLASDB_URL=mongodb+srv://username:password@cluster.mongodb.net/checkinly

SECRET=your_session_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET=your_cloudinary_api_secret
```

Never commit the `.env` file to Git.

Add it to `.gitignore`:

```gitignore
.env
node_modules/
```

---

# Local Development

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB account or MongoDB Atlas
* Cloudinary account
* Git

---

## Clone the Repository

```bash
git clone <repository-url>
```

Move into the project directory:

```bash
cd CheckInly
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create:

```text
.env
```

and add the required environment variables.

---

## Start the Application

```bash
npm start
```

The application should start on:

```text
http://localhost:8080
```

---

# Docker

CheckInly can be packaged as a Docker image so that the application and its runtime environment can be deployed consistently.

## Dockerfile

The Docker image contains:

```text
Node.js Runtime
      |
      v
Application Dependencies
      |
      v
CheckInly Source
      |
      v
Express Server
```

---

## Build the Docker Image

```bash
docker build -t checkinly .
```

Verify that the image was created:

```bash
docker images
```

---

## Run the Container

```bash
docker run -p 8080:8080 --env-file .env checkinly
```

The application will then be accessible at:

```text
http://localhost:8080
```

---

## Run in Background

```bash
docker run -d \
  -p 8080:8080 \
  --env-file .env \
  --name checkinly \
  checkinly
```

Check running containers:

```bash
docker ps
```

View application logs:

```bash
docker logs checkinly
```

Stop the container:

```bash
docker stop checkinly
```

---

# Production Deployment

CheckInly is containerized using Docker and deployed using Microsoft Azure.

The deployment architecture is:

```text
                         Git Repository
                              |
                              v
                       Docker Build
                              |
                              v
                         Docker Image
                              |
                              v
                    Azure Container Service
                              |
                              v
                       Running Container
                              |
                              v
                   checkinly.ashishtiwari.dev
```

The production application runs inside a Docker container rather than directly on the host machine.

This makes the deployment environment reproducible and simplifies dependency management.

---

# Production Configuration

Production configuration is separated from the application source code.

Sensitive values such as:

* MongoDB credentials
* Session secrets
* Cloudinary credentials

are provided through environment variables.

This prevents credentials from being hardcoded into the repository.

---

# Security Considerations

The application follows several basic security practices.

## Secrets

Credentials are stored using environment variables instead of source code.

## Authentication

Protected operations require an authenticated session.

## Authorization

Users cannot modify resources that they do not own.

## Input Validation

User input is validated before being stored.

## Database Queries

MongoDB queries are constructed through Mongoose rather than manually concatenating raw database commands.

## Production Environment

Sensitive production configuration is injected into the container through environment variables.

---

# API and Request Flow

A typical request to view a listing follows this flow:

```text
Browser
  |
  | GET /listings/:id
  v
Express Router
  |
  v
Listing Controller
  |
  v
Mongoose
  |
  v
MongoDB
  |
  v
Listing + Owner + Reviews
  |
  v
EJS Template
  |
  v
HTML Response
  |
  v
Browser
```

A listing creation request follows:

```text
Browser
  |
  | POST /listings
  v
Express Router
  |
  v
Authentication Middleware
  |
  v
Validation Middleware
  |
  v
Upload Middleware
  |
  v
Cloudinary
  |
  v
Listing Controller
  |
  v
Mongoose
  |
  v
MongoDB
  |
  v
Redirect
```

---

# Why This Project?

CheckInly was built to go beyond basic CRUD functionality and provide experience with the complete lifecycle of a web application.

The project covers:

```text
Frontend
   +
Backend
   +
Database
   +
Authentication
   +
Authorization
   +
File Storage
   +
Validation
   +
Error Handling
   +
Containerization
   +
Cloud Deployment
```

This makes the project representative of the type of architecture used in real-world web applications.

---

# Challenges Solved

## MongoDB Relationships

Listings, users, and reviews have relationships that need to be handled correctly.

Mongoose references and population were used to retrieve related documents.

---

## Authorization

Simply checking whether a user is logged in is not sufficient.

The application also verifies ownership before allowing users to edit or delete resources.

---

## Image Storage

Instead of storing uploaded images inside the application server, Cloudinary is used as external object storage.

This is particularly useful when deploying applications inside containers because containers should not be treated as permanent file storage.

---

## Search and Pagination

Search filters and pagination need to work together without losing the user's selected query parameters.

The application preserves relevant query parameters while navigating between pages.

---

## Production Deployment

The application was containerized using Docker and deployed to Azure.

This required handling:

* Docker image creation
* Port configuration
* Environment variables
* Production configuration
* Container execution
* Domain configuration
* Cloud deployment

---

# Future Improvements

The current application can be extended with several production-oriented features.

## Booking System

Add:

* Booking creation
* Availability management
* Check-in/check-out dates
* Booking history
* Host booking management

---

## Payments

Integrate a payment provider to support:

* Online payments
* Booking confirmation
* Payment status
* Refund handling

---

## Maps

Integrate a map provider to allow users to:

* View listing locations
* Search by geographic area
* Explore nearby properties
* Select locations interactively

---

## Wishlist

Allow users to save properties for later.

```text
User
 |
 v
Wishlist
 |
 +-- Listing A
 +-- Listing B
 +-- Listing C
```

---

## Host Dashboard

A dedicated dashboard could provide:

* Total listings
* Total reviews
* Booking statistics
* Revenue
* Occupancy
* Listing performance

---

## Caching

Redis could be introduced to cache frequently accessed data such as:

* Popular listings
* Search results
* Frequently requested pages

This could reduce database load and improve response times.

---

## Testing

Add automated tests for:

* Authentication
* Listing CRUD
* Review operations
* Authorization
* Validation
* API routes
* Database operations

Possible tools include:

```text
Jest
Supertest
MongoDB Memory Server
```

---

## CI/CD

A CI/CD pipeline could automatically:

```text
Push Code
    |
    v
Run Tests
    |
    v
Build Docker Image
    |
    v
Push Image
    |
    v
Deploy to Azure
```

This would eliminate the need for manual deployment steps.

---

# Technology Stack

## Backend

### Node.js

JavaScript runtime used to execute the backend application.

### Express.js

Web framework responsible for:

* HTTP server
* Routing
* Middleware
* Request handling
* Error handling

### MongoDB

NoSQL database used to store application data.

### Mongoose

ODM used to define schemas, relationships, validation, and database operations.

---

# Frontend

### EJS

Server-side templating engine used to generate HTML.

### Bootstrap

Used for responsive layout and UI components.

### JavaScript

Used for client-side interactions and dynamic behavior.

### CSS

Used for custom styling and application-specific UI behavior.

---

# Authentication

### Passport.js

Used for user authentication.

### Express Session

Used to maintain authenticated sessions across requests.

---

# File Storage

### Cloudinary

Used for storing and serving listing images.

---

# Deployment

### Docker

Used to containerize the application.

### Microsoft Azure

Used to host the production containerized application.

---

# Development Workflow

The project can be developed using the following workflow:

```text
1. Develop Feature
       |
       v
2. Test Locally
       |
       v
3. Build Docker Image
       |
       v
4. Test Container
       |
       v
5. Push Changes
       |
       v
6. Deploy
       |
       v
7. Verify Production
```

---

# Performance Considerations

Several architectural decisions help keep the application efficient:

* Pagination prevents loading all listings at once.
* Cloudinary handles image storage and delivery.
* MongoDB indexes can be added for frequently searched fields.
* Server-side rendering reduces the amount of frontend JavaScript required.
* Database population is used where related data is needed.
* Docker provides a consistent production runtime.

As the application grows, caching, database indexing, image optimization, and CDN strategies can be introduced.

---

# Learning Outcomes

Building CheckInly provided practical experience with:

* Node.js backend development
* Express.js
* MVC architecture
* RESTful routing
* MongoDB
* Mongoose
* Database relationships
* CRUD operations
* Authentication
* Authorization
* Session management
* Middleware design
* Input validation
* Error handling
* Cloudinary
* Server-side rendering
* Search
* Filtering
* Pagination
* Docker
* Azure deployment
* Environment configuration
* Production debugging

The project also provided experience in dealing with issues that typically do not appear in small tutorial applications, including deployment configuration, cloud environments, container networking, environment variables, database connectivity, and production debugging.

---


# Environment Setup Summary

```text
MongoDB Atlas
     |
     | Database
     v
CheckInly Backend
     |
     +---- Passport.js
     |
     +---- Express Session
     |
     +---- Cloudinary
     |
     +---- Mongoose
     |
     v
Docker Container
     |
     v
Microsoft Azure
     |
     v
Production Domain
```

---

# Contributing

Contributions and suggestions are welcome.

A typical contribution workflow is:

```bash
git clone <repository-url>

cd CheckInly

npm install

git checkout -b feature/your-feature

# Make changes

git add .

git commit -m "Add your feature"

git push origin feature/your-feature
```

Then open a pull request.

---

# License

This project is primarily developed for educational and portfolio purposes.

---

# Author

## Ashish Tiwari

Computer Science and Engineering student interested in backend development, distributed systems, cloud infrastructure, and software engineering.

Portfolio: [ashishtiwari.dev](https://ashishtiwari.dev)

GitHub: [0xashishtiwari](https://github.com/0xashishtiwari)

---

# Project Summary

CheckInly is a full-stack property listing platform that demonstrates the complete lifecycle of a modern web application:

```text
                    CHECKINLY

                      Client
                        |
                        v
                 EJS + Bootstrap
                        |
                        v
                 Express.js Server
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
     Passport       Controllers    Middleware
     Sessions           |             |
                        v             v
                    Mongoose      Validation
                        |
                        v
                    MongoDB
                        |
                        +
                        |
                        v
                   Cloudinary
                        |
                        v
                  Docker Image
                        |
                        v
                  Microsoft Azure
                        |
                        v
            checkinly.ashishtiwari.dev
```

The project combines frontend development, backend engineering, database modeling, authentication, authorization, cloud storage, containerization, and cloud deployment into a single production-oriented application.
