# @livepeer.studio/www

This package is a Next.js application and contains all the pages and components
for the Livepeer Studio user interface.

## Local Development

Install and run

```bash
yarn && yarn dev
```

## Developing against staging API

```bash
yarn dev:staging
```

## Accessing the Dashboard Locally

In order to access the Livepeer Studio Dashboard locally, you'll need to run the
API server.

### Step 1

Ensure you have Docker running.

### Step 2

Inside the `@livepeer/api` package start the postgres database.

```bash
yarn run postgres:start
```

### Step 3

While inside `@livepeer/api`, start the server.

```bash
yarn dev
```

### Step 4

Now that the server is running you should be able to sign up for an account and
access the Dashboard locally.
