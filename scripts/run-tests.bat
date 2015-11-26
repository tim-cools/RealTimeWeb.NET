if not "%1"=="" (
	..\tools\TransformConfig\TransformConfig.exe ..\src ..\config\%1.transform.config
)

..\src\packages\NUnit.Runners.2.6.4\tools\nunit-console.exe ..\src\Soloco.RealTimeWeb.nunit