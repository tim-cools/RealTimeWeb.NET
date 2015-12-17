
namespace Soloco.RealTimeWeb.Common.Store
{
    public class ConnectionString
    {
        public string Server { get; }
        public string Port { get; }
        public string Database { get; }
        public string Password { get; }
        public string UserId { get; }

        internal ConnectionString(string server, string port, string database, string userId, string password)
        {
            Port = port;
            Database = database;
            Password = password;
            UserId = userId;
            Server = server;
        }
    }
}