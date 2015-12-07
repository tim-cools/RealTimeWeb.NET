using System;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Soloco.RealTimeWeb.Monitoring.Infrastructure
{
    public class DatabaseMonitor : IMonitor
    {
        private readonly IConfigurationRoot _configurationRoot;

        public DatabaseMonitor(IConfigurationRoot configurationRoot)
        {
            if (configurationRoot == null) throw new ArgumentNullException(nameof(configurationRoot));

            _configurationRoot = configurationRoot;
        }

        public ServiceStatus GetStatus()
        {
            return new ServiceStatus
            {
                Name = "Database",
                Status = CheckStatus()
            };
        }

        private string CheckStatus()
        {
            try
            {
                var configurationSection = _configurationRoot.Get<ConnectionStrings>("connectionStrings");
                var connectionString = configurationSection.DocumentStore;

                using (var connection = new NpgsqlConnection(connectionString))
                using (var command = connection.CreateCommand())
                {
                    connection.Open();

                    command.CommandText = "SELECT now()";
                    var dateTime = (DateTime) command.ExecuteScalar();
                }
                return "Available";
            }
            catch (Exception exception)
            {
                return "Unavailable";
            }
        }
    }
}