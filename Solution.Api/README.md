# Restaurant API

The React Native app does not create the backend database by itself. Start this API before running the Android app if you want persistent data instead of the app's offline seed.

## Option 1: run with Docker Desktop

Install and start Docker Desktop first. Then run the command from the repository root, where `docker-compose.yml` is located:

```powershell
cd C:\git\Restauracja
docker compose up --build
```

If you are already inside `Solution.Api`, use:

```powershell
docker compose -f ..\docker-compose.yml up --build
```

The compose file exposes the API at `http://localhost:5000` and stores SQLite data in the `restaurant-data` Docker volume. After startup, verify it in a browser at `http://localhost:5000/health` first, then open Swagger at `http://localhost:5000/swagger`, the database dashboard at `http://localhost:5000/db-view`, or the raw store JSON at `http://localhost:5000/api/restaurant/store`.

## Option 2: run without Docker

Install the .NET SDK matching the project target framework, then run:

```powershell
cd C:\git\Restauracja\Solution.Api
dotnet restore
dotnet run --launch-profile http
```

This starts the API at `http://localhost:5000`. SQLite is created automatically as `restaurant.db` the first time the API starts. Swagger is available at `http://localhost:5000/swagger`, and the browser database preview is available at `http://localhost:5000/db-view`.

## Then run the mobile app

In a second terminal:

```powershell
cd C:\git\Restauracja\Solution
pnpm react-native run-android
```

Android Emulator resolves the host machine as `10.0.2.2`, so the mobile client calls `http://10.0.2.2:5000/api/restaurant`.


## Troubleshooting localhost

If `http://localhost:5000/api/restaurant/store` does not open:

1. Keep the `docker compose up --build` terminal open and check whether the API container is still running.
2. Open `http://localhost:5000/health`; it should return a small JSON response.
3. If the port is already taken, stop the other process or change the left side of the `ports` mapping in `docker-compose.yml`.
4. Rebuild after Dockerfile or compose changes: `docker compose up --build --force-recreate`.

If the API container exits during seeding after an earlier failed run, remove the old SQLite volume and recreate the container:

```powershell
docker compose down -v
docker compose up --build --force-recreate
```
