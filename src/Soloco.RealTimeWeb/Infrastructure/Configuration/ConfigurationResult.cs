using Soloco.RealTimeWeb.Common;

namespace Soloco.RealTimeWeb.Infrastructure.Configuration
{
    public class ConfigurationResult : Result
    {
        public string ConnectionString { get; }
        public string ConnectionStringAdmin { get;  }
        public string RabbitMqHostName { get; }
        public string RabbitMqUserName { get; }
        public string RabbitMqPassword { get; }
        public string AuthenticationGoogleClientId  { get; }
        public string AuthenticationGoogleClientSecret  { get; }
        public string AuthenticationFacebookAppId  { get; }
        public string AuthenticationFacebookAppSecret  { get; }

        public ConfigurationResult(string connectionString, string connectionStringAdmin, string rabbitMqHostName, string rabbitMqUserName, string rabbitMqPassword, string authenticationGoogleClientId, string authenticationGoogleClientSecret, string authenticationFacebookAppId, string authenticationFacebookAppSecret)
            : base(true)
        {
            ConnectionString = connectionString;
            ConnectionStringAdmin = connectionStringAdmin;
            RabbitMqHostName = rabbitMqHostName;
            RabbitMqUserName = rabbitMqUserName;
            RabbitMqPassword = rabbitMqPassword;
            AuthenticationGoogleClientId = authenticationGoogleClientId;
            AuthenticationGoogleClientSecret = authenticationGoogleClientSecret;
            AuthenticationFacebookAppId = authenticationFacebookAppId;
            AuthenticationFacebookAppSecret = authenticationFacebookAppSecret;
        }

        public ConfigurationResult() : base(true)
        {
        }
    }
}