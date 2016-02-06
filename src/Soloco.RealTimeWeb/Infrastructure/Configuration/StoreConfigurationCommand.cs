using System;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Infrastructure.Configuration
{
    public class StoreConfigurationCommand : ICommand
    {
        public string ConnectionString { get; set; }
        public string ConnectionStringAdmin { get; set; }
        public string RabbitMqHostName { get; set; }
        public string RabbitMqUserName { get; set; }
        public string RabbitMqPassword { get; set; }
        public string FacebookAppId { get; set; }
        public string FacebookAppSecret { get; set; }
        public string GoogleClientId { get; set; }
        public string GoogleClientSecret { get; set; }

        public StoreConfigurationCommand(string connectionString, string connectionStringAdmin, string rabbitMqHostName, string rabbitMqUserName, string rabbitMqPassword, string facebookAppId, string facebookAppSecret, string googleClientId, string googleClientSecret)
        {
            ConnectionString = connectionString;
            ConnectionStringAdmin = connectionStringAdmin;
            RabbitMqHostName = rabbitMqHostName;
            RabbitMqUserName = rabbitMqUserName;
            RabbitMqPassword = rabbitMqPassword;
            FacebookAppId = facebookAppId;
            FacebookAppSecret = facebookAppSecret;
            GoogleClientId = googleClientId;
            GoogleClientSecret = googleClientSecret;
        }
    }
}