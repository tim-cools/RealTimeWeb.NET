cd src/Soloco.RealTimeWeb

call npm run tests

cd ../..

call dnx -p ./src/Soloco.RealTimeWeb.Common.Tests test
call dnx -p ./src/Soloco.RealTimeWeb.Membership.Tests test
call dnx -p ./src/Soloco.RealTimeWeb.Tests test