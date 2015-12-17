using System;
using Npgsql;
using Soloco.RealTimeWeb.Common.Store;

namespace Soloco.RealTimeWeb.Monitoring.Infrastructure
{
    public class DatabaseMonitor : IMonitor
    {
        private readonly IConnectionStringParser _connectionStringParser;

        public DatabaseMonitor(IConnectionStringParser connectionStringParser)
        {
            if (connectionStringParser == null) throw new ArgumentNullException(nameof(connectionStringParser));

            _connectionStringParser = connectionStringParser;
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
                var connectionString = _connectionStringParser.GetString();

                using (var connection = new NpgsqlConnection(connectionString))
                using (var command = connection.CreateCommand())
                {
                    connection.Open();

                    command.CommandText = "SELECT now()";
                    var dateTime = (DateTime) command.ExecuteScalar();
                }
                return "Available";
            }
            catch (Exception)
            {
                return "Unavailable";
            }
        }
    }
}