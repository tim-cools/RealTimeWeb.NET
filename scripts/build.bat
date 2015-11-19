rem restore nuget packages
..\tools\nuget\nuget.exe restore ..\src\Soloco.ReactiveStarterKit.sln

rem build client

cd ..\src\Soloco.ReactiveStarterKit

call npm install 
call npm run build

cd ..\..\scripts

rem build vs solution
"C:\Program Files (x86)\MSBuild\14.0\Bin\MSBuild.exe" ..\src\Soloco.ReactiveStarterKit.sln 