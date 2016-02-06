using System;
using System.Data.Common;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Soloco.RealTimeWeb.Common.Store
{
    public class ConnectionStringParser : IConnectionStringParser
    {
        private readonly IConfiguration _configuration;

        public ConnectionStringParser(IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));

            _configuration = configuration;
        }

        public string GetString(string name = "documentStore")
        {
            var connectionString = _configuration.ConnectionString(name);
            return string.IsNullOrWhiteSpace(connectionString) ? null : connectionString;
        }
        
        public ConnectionString Parse(string name = "documentStore")
        {
            using (var connection = new NpgsqlConnection())
            {
                var factory = DbProviderFactories.GetFactory(connection);
                var builder = factory.CreateConnectionStringBuilder();
                builder.ConnectionString = GetString(name);

                return new ConnectionString(
                    GetPart(builder, "Server"),
                    GetPart(builder, "Port"),
                    GetPart(builder, "database"),
                    GetPart(builder, "User Id"),
                    GetPart(builder, "password")
                    );
            }
        }

        private static string GetPart(DbConnectionStringBuilder builder, string name)
        {
            return builder[name]?.ToString();
        }
    }
}