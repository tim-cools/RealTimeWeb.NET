using Marten;
using Npgsql;

namespace Soloco.RealTimeWeb.Common.Infrastructure.Store
{
    public class ConnectionFromConfig : IConnectionFactory
    {
        private readonly string _connectionString;

        public ConnectionFromConfig()
        {
            _connectionString = ConnectionString.GetString();
        }

        public NpgsqlConnection Create()
        {
            return new NpgsqlConnection(_connectionString);
        }
    }
}