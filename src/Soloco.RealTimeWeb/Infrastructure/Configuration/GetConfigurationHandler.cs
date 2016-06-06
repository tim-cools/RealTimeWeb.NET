using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.PlatformAbstractions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Infrastructure.Configuration
{
    public class GetConfigurationHandler : IHandleMessage<GetConfigurationQuery, ConfigurationResult>
    {
        private readonly ApplicationEnvironment _applicationEnvironment;

        public GetConfigurationHandler(ApplicationEnvironment applicationEnvironment)
        {
            if (applicationEnvironment == null) throw new ArgumentNullException(nameof(applicationEnvironment));

            _applicationEnvironment = applicationEnvironment;
        }

        public Task<ConfigurationResult> Handle(GetConfigurationQuery command)
        {
            var localConfigFileName =  ConfigurationData.GetFileName(_applicationEnvironment.ApplicationBasePath);

            if (!File.Exists(localConfigFileName))
            {
                return Task.FromResult(new ConfigurationResult());
            }

            var json = File.ReadAllText(localConfigFileName);
            dynamic dynamic = JsonConvert.DeserializeObject(json);
            var configuration = new ConfigurationResult(
                dynamic.connectionStrings?.documentStore?.Value,
                dynamic.connectionStrings?.documentStoreAdmin?.Value,
                dynamic.rabbitMq?.hostName?.Value,
                dynamic.rabbitMq?.userName?.Value,
                dynamic.rabbitMq?.password?.Value,
                dynamic.authentication?.google?.clientId?.Value,
                dynamic.authentication?.google?.clientSecret?.Value,
                dynamic.authentication?.facebook?.appId?.Value,
                dynamic.authentication?.facebook?.appSecret?.Value);

            return Task.FromResult(configuration);
        }
    }
}