using System;
using System.Diagnostics;
using System.IO;

namespace Soloco.ReactiveStarterKit.Common.Tests.Storage
{
    public static class TestStore
    {
        private const string psqlPath = @"C:\Program Files\PostgreSQL\9.4\bin\psql.exe"; //todo add alternative paths or move to config if necessary

        static TestStore()
        {
            CreateCleanStoreDatabase();
        }

        private static void CreateCleanStoreDatabase()
        {
            Console.WriteLine("Test Store Database Creating");

            var tempScriptFileName = WriteTempSqlScript();
            var command = $"-f {tempScriptFileName} -U postgres";

            Console.WriteLine($"Executing script {tempScriptFileName} with exe {psqlPath} and command {command}.");

            StartAndOutputProcess(command);

            Console.WriteLine("Test Store Database Created");

            File.Delete(tempScriptFileName);
        }

        private static void StartAndOutputProcess(string command)
        {
            var process = new Process { StartInfo = ProcessInfo(command) };
            process.Start();
            WriteOutputToDebug(process);
        }

        private static void WriteOutputToDebug(Process process)
        {
            while (!process.StandardOutput.EndOfStream)
            {
                var line = process.StandardOutput.ReadLine();
                Console.WriteLine(line);
            }
        }

        private static ProcessStartInfo ProcessInfo(string command)
        {
            return new ProcessStartInfo
            {
                FileName = psqlPath,
                Arguments = command,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true
            };
        }

        private static string WriteTempSqlScript()
        {
            var script = typeof (TestStore).ReadResourceString("CreateStore.sql");

            var tempScriptFileName = Path.GetTempFileName();
            File.WriteAllText(tempScriptFileName, script);
            return tempScriptFileName;
        }
    }
}