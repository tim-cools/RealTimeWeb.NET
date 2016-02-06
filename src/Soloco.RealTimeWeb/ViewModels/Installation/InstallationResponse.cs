using System.ComponentModel;

namespace Soloco.RealTimeWeb.ViewModels.Installation
{
    public class InstallationResponse
    {
        public bool Complete { get; }

        [DisplayName("PostgreSQL Connection string")]
        public string ConnectionString { get; set; }
        [DisplayName("PostgreSQL Admin Connection string (only used for automated tests)")]
        public string ConnectionStringAdmin { get; set; }

        [DisplayName("RabbitMq Host Name")]
        public string RabbitMqHostName { get; set; }
        [DisplayName("RabbitMq User Name")]
        public string RabbitMqUserName { get; set; }
        [DisplayName("RabbitMq Password")]
        public string RabbitMqPassword { get; set; }

        [DisplayName("Facebook App Id")]
        public string FacebookAppId { get; set; }

        [DisplayName("Facebook App Secret")]
        public string FacebookAppSecret { get; set; }

        [DisplayName("Google Client Id")]
        public string GoogleClientId { get; set; }

        [DisplayName("Google Client Secret")]
        public string GoogleClientSecret { get; set; }

        public InstallationResponse(bool complete)
        {
            Complete = complete;
        }
    }
}