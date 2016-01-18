cd src/Soloco.RealTimeWeb

npm run tests

cd ../..

dnx -p ./src/Soloco.RealTimeWeb.Common.Tests test
dnx -p ./src/Soloco.RealTimeWeb.Membership.Tests test
dnx -p ./src/Soloco.RealTimeWeb.Tests test