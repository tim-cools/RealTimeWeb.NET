cd src/Soloco.RealTimeWeb

npm run tests

cd ../..

dotnet test ./src/Soloco.RealTimeWeb.Common.Tests
dotnet test ./src/Soloco.RealTimeWeb.Membership.Tests
dotnet test ./src/Soloco.RealTimeWeb.Tests