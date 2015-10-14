using System;
using System.Configuration;
using System.Diagnostics;
using System.IO;
using Elephanet;

namespace Soloco.ReactiveStarterKit.Common.Tests.Storage
{
    public static class TestStore
    {
        private const string psqlPath = @"C:\Program Files\PostgreSQL\9.4\bin\psql.exe"; //todo add alternative paths or move to config if necessary

        private static DocumentStore _store;
        
        static TestStore()
        {
            CreateCleanStoreDatabase();
            CreateStore();
        }

        private static void CreateStore()
        {
            var connectionString = GetConnectionString();
            _store = new DocumentStore(connectionString.ConnectionString);
        }

        private static ConnectionStringSettings GetConnectionString()
        {
            var connectionString = ConfigurationManager.ConnectionStrings["documentStore"];
            if (string.IsNullOrWhiteSpace(connectionString?.ConnectionString))
            {
                throw new InvalidOperationException("ConnectionString 'documentStore' not found in app.config");
            }
            return connectionString;
        }

        private static void CreateCleanStoreDatabase()
        {
            Debug.WriteLine($"Test Store Database Creating");

            var tempScriptFileName = WriteTempSqlScript();
            var command = $"-f {tempScriptFileName} -U postgres";

            Debug.WriteLine($"Executing script {tempScriptFileName} with exe {psqlPath} and command {command}.");

            StartAndOutputProcess(command);

            Debug.WriteLine($"Test Store Database Created");

            File.Delete(tempScriptFileName);
        }

        private static void StartAndOutputProcess(string command)
        {
            var process = new Process { StartInfo = ProcessInfo(command) };
            process.Start();
            WriiteOutputToDebug(process);
        }

        private static void WriiteOutputToDebug(Process process)
        {
            while (!process.StandardOutput.EndOfStream)
            {
                var line = process.StandardOutput.ReadLine();
                Debug.WriteLine(line);
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

        public static IDocumentSession CreateSession()
        {
            return _store.OpenSession();
        }
    }
}