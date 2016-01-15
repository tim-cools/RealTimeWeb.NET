using System;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Infrastructure.Configuration
{
    public class StoreConfigurationCommand : ICommand
    {
        public string FacebookAppId { get; set; }
        public string FacebookAppSecret { get; set; }
        public string GoogleClientId { get; set; }
        public string GoogleClientSecret { get; set; }

        public StoreConfigurationCommand(string facebookAppId, string facebookAppSecret, string googleClientId, string googleClientSecret)
        {
            FacebookAppId = facebookAppId;
            FacebookAppSecret = facebookAppSecret;
            GoogleClientId = googleClientId;
            GoogleClientSecret = googleClientSecret;
        }
    }
}