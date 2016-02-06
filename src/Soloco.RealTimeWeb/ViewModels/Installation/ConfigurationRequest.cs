namespace Soloco.RealTimeWeb.ViewModels.Installation
{
    public class ConfigurationRequest
    {
        public string ConnectionStringAdmin { get; set; }
        public string ConnectionString { get; set; }
        public string RabbitMqHostName { get; set; }
        public string RabbitMqUserName { get; set; }
        public string RabbitMqPassword { get; set; }
        public string FacebookAppId { get; set; }
        public string FacebookAppSecret { get; set; }
        public string GoogleClientId { get; set; }
        public string GoogleClientSecret { get; set; }
    }
}