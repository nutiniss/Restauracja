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

The compose file exposes the API at `http://localhost:5000` and stores SQLite data in the `restaurant-data` Docker volume.

## Option 2: run without Docker

Install the .NET SDK matching the project target framework, then run:

```powershell
cd C:\git\Restauracja\Solution.Api
dotnet restore
dotnet run --launch-profile http
```

This starts the API at `http://localhost:5000`. SQLite is created automatically as `restaurant.db` the first time the API starts.

## Then run the mobile app

In a second terminal:

```powershell
cd C:\git\Restauracja\Solution
pnpm react-native run-android
```

Android Emulator resolves the host machine as `10.0.2.2`, so the mobile client calls `http://10.0.2.2:5000/api/restaurant`.
