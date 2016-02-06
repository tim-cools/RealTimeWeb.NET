using System;
using Npgsql;
using Serilog;
using Soloco.RealTimeWeb.Common.Store;

namespace Soloco.RealTimeWeb.Common.Tests.Storage
{
    public class TestStoreDatabaseFactory : ITestStoreDatabaseFactory
    {
        private readonly IConnectionStringParser _connectionStringParser;

        public TestStoreDatabaseFactory(IConnectionStringParser connectionStringParser)
        {
            if (connectionStringParser == null) throw new ArgumentNullException(nameof(connectionStringParser));

            _connectionStringParser = connectionStringParser;
        }

        public void CreateCleanStoreDatabase()
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

        private NpgsqlConnection CreateAdminConnection()
        {
            var adminConnection = _connectionStringParser.GetString("documentStoreAdmin");
            return new NpgsqlConnection(adminConnection);
        }

        private string CreateScript()
        {
            var connectionString = _connectionStringParser.Parse();
            var script = typeof(TestStoreDatabaseFactory)
                .ReadResourceString("CreateStore.sql")
                .Replace("{database}", connectionString.Database)
                .Replace("{userId}", connectionString.UserId)
                .Replace("{password}", connectionString.Password);

            Log.Information($"Script: {script}");
            return script;
        }
    }

}
