if not "%1"=="" (
	set Hosting:Environment=%1
)

dnx -p .\src\Soloco.RealTimeWeb.Common.Tests test
dnx -p .\src\Soloco.RealTimeWeb.Membership.Tests test