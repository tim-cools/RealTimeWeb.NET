using System;
using System.Configuration;
using System.Data.Common;
using Npgsql;

namespace Soloco.RealTimeWeb.Common.Infrastructure.Store
{
    public class ConnectionString
    {
        public string Server { get; }
        public string Port { get; }
        public string Database { get; }
        public string Password { get; }
        public string UserId { get; }

        private ConnectionString(string server, string port, string database, string password, string userId)
        {
            Port = port;
            Database = database;
            Password = password;
            UserId = userId;
            Server = server;
        }

        public static string GetString()
        {
            var connectionString = ConfigurationManager.ConnectionStrings["documentStore"];
            if (string.IsNullOrWhiteSpace(connectionString?.ConnectionString))
            {
                throw new InvalidOperationException("ConnectionString 'documentStore' not found in app.config");
            }
            return connectionString.ConnectionString;
        }
        
        public static ConnectionString Parse()
        {
            using (var connection = new NpgsqlConnection())
            {
                var factory = DbProviderFactories.GetFactory(connection);
                var builder = factory.CreateConnectionStringBuilder();
                builder.ConnectionString = GetString();

                return new ConnectionString(
                    GetPart(builder, "Server"),
                    GetPart(builder, "Port"),
                    GetPart(builder, "User Id"),
                    GetPart(builder, "password"),
                    GetPart(builder, "database")
                    );
            }
        }

        private static string GetPart(DbConnectionStringBuilder builder, string name)
        {
            return builder[name]?.ToString();
        }
    }
}