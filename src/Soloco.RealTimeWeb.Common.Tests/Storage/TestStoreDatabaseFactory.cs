using System;
using System.Diagnostics;
using System.IO;
using Npgsql;
using Serilog;
using Soloco.RealTimeWeb.Common.Infrastructure.Store;

namespace Soloco.RealTimeWeb.Common.Tests.Storage
{
    public static class TestStoreDatabaseFactory
    {
        public static void CreateCleanStoreDatabase()
        {
            Log.Information("Test Store Database Creating");

            var script = CreateScript();

            using (var connection = CreateAdminConnection())
            using (var command  = connection.CreateCommand())
            {
                connection.Open();

                command.CommandText = script;
                command.ExecuteNonQuery();
            }

            Log.Information("Test Store Database Created");
        }

        private static NpgsqlConnection CreateAdminConnection()
        {
            var adminConnection = ConnectionString.GetString("documentStoreAdmin");
            return new NpgsqlConnection(adminConnection);
        }

        private static string CreateScript()
        {
            var connectionString = ConnectionString.Parse();
            var script = typeof(TestStoreDatabaseFactory).ReadResourceString("CreateStore.sql")
                .Replace("{database}", connectionString.Database)
                .Replace("{userId}", connectionString.UserId)
                .Replace("{password}", connectionString.Password);

            Log.Information($"Script: {script}");
            return script;
        }
    }
}
