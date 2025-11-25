# Users Management API

This project provides a RESTful API for managing users (stores users in a database). It is built from the ***plain specification [users-management-api.plain](users-management-api.plain).

## Prerequisites

### plain2code renderer directory

Refer to https://github.com/Codeplain-ai/plain2code_client?tab=readme-ov-file#prerequisites on how to setup the code rendering engine and how to get the API key.

### Database

Database is externally hosted. It is assumed the database is running on port 5433.

Use [docker-compose.yml](docker-compose.yml) to start the database.

```
docker compose up --build -d
```

This should also apply database migrations.

To verify if migrations are working, run the following command:

```
psql postgresql://user:password@localhost:5433/mydb
```

and then run

```
\dt
```

you should see `users` table:

```
       List of relations
 Schema | Name  | Type  | Owner 
--------+-------+-------+-------
 public | users | table | user
(1 row)
```

### Node.js - related dependencies

- Node.js
- npm

## Rendering the project

You need to set `PLAIN2CODE_RENDERER_DIR` environmental variable to the directory containing the plain2code.py script.
 
Then run

```
python3 $PLAIN2CODE_RENDERER_DIR/plain2code.py users-management-api.plain
```