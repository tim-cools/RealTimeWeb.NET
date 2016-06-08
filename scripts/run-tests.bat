if not "%1"=="" (
	set ASPNETCORE_ENVIRONMENT=%1
)

dotnet test ./src/Soloco.RealTimeWeb.Common.Tests
dotnet test ./src/Soloco.RealTimeWeb.Membership.Tests
dotnet test ./src/Soloco.RealTimeWeb.Tests

cd ./src/Soloco.RealTimeWeb

call npm run tests

cd ../..