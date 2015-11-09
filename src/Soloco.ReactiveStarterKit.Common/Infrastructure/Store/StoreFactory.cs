using System;
using System.Configuration;
using Marten;
using Npgsql;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Store
{
    public class ConnectionFromConfig : IConnectionFactory
    {
        private readonly ConnectionStringSettings _connectionString;

        public ConnectionFromConfig()
        {
            _connectionString = GetConnectionString();
        }

        public NpgsqlConnection Create()
        {
            return new NpgsqlConnection(_connectionString.ConnectionString);
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
    }
}