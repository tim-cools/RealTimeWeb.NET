using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using Serilog;
using Soloco.RealTimeWeb.Common.Infrastructure.Store;

namespace Soloco.RealTimeWeb.Common.Tests.Storage
{
    public static class TestStoreDatabaseFactory
    {
        //todo add alternative paths or move to config if necessary
        private static readonly string[] _versions = { "9.4", "9.5" };
        private const string _psqlPath = @"C:\Program Files\PostgreSQL\{version}\bin\psql.exe";
        private const string _psqlPathLinux = "psql";

        public static void CreateCleanStoreDatabase()
        {
            Log.Information("Test Store Database Creating");

            var connectionString = ConnectionString.Parse();
            VerifyIsLocalHost(connectionString);

            var tempScriptFileName = WriteTempSqlScript(connectionString.Database, connectionString.UserId, connectionString.Password);
            var command = $"-f {tempScriptFileName} -U postgres -v ON_ERROR_STOP=1 -p {connectionString.Port}";

            var path = Environment.IsRunningOnMono && Environment.IsLinux ? _psqlPathLinux : GetWindowsPath();

            Log.Information($"Executing script {tempScriptFileName} with exe {path} and command {command}.");

            StartAndOutputProcess(path, command);

            Log.Information("Test Store Database Created");

            File.Delete(tempScriptFileName);
        }

        private static void VerifyIsLocalHost(ConnectionString connectionString)
        {
            if (connectionString.Server != "127.0.0.1")
            {
                throw new InvalidOperationException("Only localhost is now supported because psql asks for a password otherwised. " +
                                                    "If you want to solve this you should make user the password of postgres user. (Not really safe)");
            }
        }

        private static string GetWindowsPath()
        {
            foreach (var version in _versions)
            {
                var path = _psqlPath.Replace("{version}", version);
                if (File.Exists(path))
                {
                    return path;
                }
            }

            var versionList = string.Join(", ", _versions);
            throw new InvalidOperationException($"Could not find psql.exe. Supported version: {versionList}");
        }

        private static void StartAndOutputProcess(string path, string command)
        {
            using (var process = new Process { StartInfo = ProcessInfo(path, command) })
            {
                process.Start();

                process.WaitForExit(20000);
                process.OutputDataReceived += (s, e) => { Log.Information("StandardOutput: " + e.Data); };
                process.ErrorDataReceived += (s, e) => { Log.Error("StandardError: " + e.Data); };

                process.BeginOutputReadLine();

                if (!process.WaitForExit(60000))
                {
                    process.Kill();
                    throw new InvalidOperationException(
                        $"Could not initilaize database.{System.Environment.NewLine}" +
                        $"Process: {path} {command}{System.Environment.NewLine}" +
                        $"Exit code: {process.ExitCode}{System.Environment.NewLine}" +
                        $"The database will be dropped. Ensure you are noy connected to the database.");
                }

                if (process.ExitCode != 0)
                {
                    throw new InvalidOperationException(
                        $"Could not initilaize database.{System.Environment.NewLine}" + 
                        $"Process: {path} {command}{System.Environment.NewLine}" +
                        $"Exit code: {process.ExitCode}{System.Environment.NewLine}");
                }
            }
        }

        private static ProcessStartInfo ProcessInfo(string path, string command)
        {
            return new ProcessStartInfo
            {
                FileName = path,
                Arguments = command,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };
        }

        private static string WriteTempSqlScript(string database, string userId, string password)
        {
            var script = typeof(TestStoreDatabaseFactory).ReadResourceString("CreateStore.sql")
                .Replace("{database}", database)
                .Replace("{userId}", userId)
                .Replace("{password}", password);

            var tempScriptFileName = Path.GetTempFileName();
            File.WriteAllText(tempScriptFileName, script);
            Log.Information($"Script {tempScriptFileName}: {script}");
            return tempScriptFileName;
        }
    }
}
