## Description

This is the web platform, structured as a **Bun workspaces monorepo** containing a NestJS backend and a Next.js frontend. It provides a solid foundation with best practices, security features, and production-ready configurations.

### Monorepo layout

```
platform/
├── apps/
│   ├── api/   # NestJS backend (REST + WebSocket, BetterAuth, Kysely)
│   └── web/   # Next.js frontend (App Router)
├── docker-compose.yml   # Local infrastructure (Postgres, Redis, etc.)
├── biome.json           # Shared formatter/linter config
└── package.json         # Workspace root + orchestration scripts
```

The backend (`apps/api`) runs on `http://localhost:3001/api` and the frontend (`apps/web`) on `http://localhost:3000`.

## Table of Contents
- [Description](#description)
- [Features](#features)
- [Installation](#installation)
  - [Dependencies](#dependencies)
  - [Docker (Development)](#docker-development)
  - [Manual (Development/Production)](#manual-developmentproduction)
- [Deployment](#deployment)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Contributing](#contributing)
  - [Project Structure](#project-structure)
  - [Development Guidelines](#development-guidelines)
    - [Database](#database)
    - [Migrations](#migrations)
    - [Transactions](#transactions)
    - [Adding New Features](#adding-new-features)
    - [Code Style](#code-style)
- [Stay in touch](#stay-in-touch)
- [License](#license)

## Features

- 🔐 **Authentication & Authorization**
  - Authentication and authorization is handled by BetterAuth.

- 🏗️ **Architecture & Structure**
  - Modular architecture following NestJS best practices
  - Clear separation of concerns (Controllers, Services, DAOs)
  - TypeScript-first approach with strict type checking

- 🛠️ **Development Tools**
  - Docker development environment
  - Database migrations with Kysely
  - Redis integration for caching and pub/sub
  - Swagger/OpenAPI documentation
  - Comprehensive logging system

- 🚀 **Production Ready**
  - Environment-based configuration
  - Error handling and validation
  - Request/Response serialization

- 📊 **Database & Caching**
  - PostgreSQL integration
  - Redis caching layer
  - Database migrations
  - Connection pooling

- 🧪 **Testing**
  - Unit testing setup
  - E2E testing configuration
  - Test coverage reporting
  - Mocking utilities

## Installation
Each app has its own environment file. Copy the examples before running:

```bash
$ cp apps/api/.env.example apps/api/.env
$ cp apps/web/.env.example apps/web/.env
```

Then install all workspace dependencies from the repository root:

```bash
$ bun install
```

### Dependencies

### Docker (Development)
If you are going to use docker, then setup all the necessary software dependencies with the following command:
```bash
$ docker-compose up -d -V --build
```
You can then shutdown the application with the following command:
```bash
$ docker-compose down
```

If you're using docker to spin up the local environment, you can access the **Postgres** on port `5432` and **Redis** on `6379`.
You can also access **pgAdmin 4** in the browser on port `8082` and **Redis Commander** on port `8083`. You will need to make sure
that you create any necessary databases for local development.

### Manual (Development/Production)
If you are setting up the application for a production environment, then change the variables within the relevant
`apps/api/.env` file for connecting to your production **postgres** and **Redis**. Install dependencies and run the
database migrations (from the API workspace):

```bash 
$ bun install
$ bun run --filter '@platform/api' db:migrate
```

From the repository root you can run both apps together, or each individually:

```bash
# run the frontend and backend together (watch mode)
$ bun run dev

# run just the backend
$ bun run dev:api

# run just the frontend
$ bun run dev:web
```

You should now be able to access the frontend at `http://localhost:3000` and the API at `http://localhost:3001/api`.

## Deployment
Ideally, you'll want to deploy this application using container orchestration infrastructure and then connecting to
the relevant services. You'll want to first build the application for production which will get rid of the development
dependencies and unused code keeping the overall bundle light. You can build both apps from the root:
```bash
$ bun run build
```
This produces `apps/api/dist` (NestJS bundle) and `apps/web/.next` (Next.js build). You can then start each app:
```bash
# backend (production mode)
$ bun run --filter '@platform/api' start:prod

# frontend (production mode)
$ bun run --filter '@platform/web' start
```
It is recommended you use a process manager like [pm2](https://pm2.keymetrics.io/) for running applications in a production
environment. You should also consider only deploying the production required dependencies, this can only be done after the
application build has been created, so if you have any development dependencies, you'll want to delete the `node_modules` directory
before proceeding. You can install the production only dependencies with the following command:
```bash 
$ bun install --production
```

## Testing
If you wish to run through the application's test suite with the following commands:

```bash 
# unit tests 
$ bun run --filter '@platform/api' test 
 
# e2e tests 
$ bun run --filter '@platform/api' test:e2e 
 
# test coverage 
$ bun run --filter '@platform/api' test:cov 
```

## API Reference

The API documentation can be accessed at `/api/reference` when running the application. Here you will find every API documented endpoint.

## Contributing

### Project Structure
```
apps/
├── api/                     # NestJS backend
│   └── src/
│       ├── app.module.ts    # Main application module
│       ├── main.ts          # Application entry point
│       ├── auth/            # BetterAuth configuration
│       ├── config/          # Configuration files
│       ├── database/        # Database related files
│       │   └── migrations/  # Kysely migrations
│       ├── filters/         # Exception filters
│       ├── modules/         # Feature modules
│       │   ├── email/       # Email delivery
│       │   ├── socket/      # WebSocket functionality
│       │   └── user/        # User management
│       ├── postgres/        # Postgres pool/provider
│       └── redis/           # Redis configuration and utilities
└── web/                     # Next.js frontend
    ├── app/                 # App Router routes
    ├── components/          # React components
    └── lib/                 # Shared client utilities
```

### Development Guidelines

#### Database

##### Migrations
This project uses Kysely for database migrations. Here's how to work with migrations:

1. Create a new migration:
```bash
$ bunx kysely-ctl migrate:make migration_name
```

2. Run migrations:
```bash
$ bun run db:migrate
```
This will run Better Auth migrations, Kysely migrations, and generate TypeScript types.

3. Rollback migrations:
```bash
$ bun run db:rollback
```

4. Generate TypeScript types from database:
```bash
$ bun run db:generate
```

##### Transactions
Database transactions should be managed exclusively within the service layer. This ensures that:
- Business logic remains atomic and consistent
- Transaction boundaries align with business operations
- Controllers remain focused on HTTP concerns
- DAOs remain focused on data access patterns

###### ⚠️ Transaction Checkpoints
> Modern databases implement automatic checkpointing mechanisms that handle data persistence efficiently. 
> As such, explicit checkpoint implementation is generally unnecessary. However, if your specific use case requires manual checkpointing, 
> this would be the only exception where transactions should be managed within a DAO. In such cases, it's recommended to create a dedicated 
> DAO specifically for checkpoint-related operations to maintain clear separation of concerns and code organization.

Example of proper transaction usage in a service:
```typescript
@Injectable()
export class UserService {
  constructor(private readonly userDao: UserDao) {}

  async createUser(userData: CreateUserDto): Promise<UserDto> {

    // This will create a new transaction
    this.userDao.transaction(async (trx) => {

      // This creates new dao instances where all the methods on these instances when 
      // called will use the transaction, this gives more flexibility, allowing you to 
      // still use the dao instances and call methods which are outside of the transaction
      // context
      const userDao = this.userDao.transacting(trx);
      const profileDao = this.profileDao.transacting(trx);

      // This is called ignoring the transaction since it's using the original dao instance
      const oldUser = this.userDao.findById(1)

      // These are part of the transaction
      const profile = await profileDao.create(...);
      const user = await userDao.create({ ..., profileId: profile.id });

      if (!user) {
        throw new Error() // throwing an error aborts the transaction
      }
      
      return user;
    });
  }
}
```

#### Adding New Features
Each feature module (e.g., auth, user) follows this structure:
```
modules/
└── [feature]/
    ├── controllers/    # HTTP request handlers
    ├── services/       # Business logic
    ├── daos/          # Data access objects
    ├── dtos/          # Data transfer objects
    ├── events/        # Event type definitions
    └── [feature].module.ts  # Module definition
```

When adding a new feature, follow these steps:
1. Create necessary database migrations
2. Create DTOs (Data Transfer Objects) in the module's `dtos` directory
3. Implement database queries using Kysely in the module's `daos` directory
4. Implement business logic in the module's `services` directory
5. Define event types in the `events` directory
6. Create controllers in the module's `controllers` directory
7. Add testing where appropriate
8. Update documentation

#### Code Style
- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Comment complex functions and classes
- Database transactions should only be managed within service layer methods
- Error handling responsibilities:
  - DAOs only return data or null, it should not throw errors
  - Services are responsible for business logic and are allowed to throw errors
  - Controllers are responsible for handling or escalating service related errors
- Separation of concerns:
  - Controllers should only handle HTTP requests/responses and delegate to services
  - Services contain all business logic and orchestrate data operations
  - DAOs are purely responsible for data retrieval and persistence
- Event handling:
  - Events should be treated as immutable objects
  - Event types should be defined as readonly interfaces
- Documentation:
  - Controllers and IO-related classes must be documented using @nestjs/swagger decorators
  - DTOs must include OpenAPI property decorators for proper API documentation
  - All API endpoints should be properly documented with `@ApiOperation`, `@ApiResponse`, etc. [See more](https://docs.nestjs.com/openapi/introduction).
  - All controller methods must use `@SerializeOptions()` decorator to explicitly handle properties should be exposed in responses

## Stay in touch

- Authors
    - [Kieron Wiltshire](mailto:kieron.wiltshire@outlook.com)
