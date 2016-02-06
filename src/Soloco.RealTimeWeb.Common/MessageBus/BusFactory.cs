using System;
using MassTransit;
using Microsoft.Extensions.Configuration;
using StructureMap;

namespace Soloco.RealTimeWeb.Common.MessageBus
{
    public class BusFactory : Registry
    {
        public static IBusControl CreateBus(IConfiguration configuration, Action<IBusFactoryConfigurator> initializer = null)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));

            var hostName = configuration["rabbitMq:hostName"];
            var userName = configuration["rabbitMq:userName"];
            var password = configuration["rabbitMq:password"];

            if (string.IsNullOrWhiteSpace(hostName) || string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(password))
            {
                return null;
            }

            var host = new Uri(hostName);
            
            var bus = Bus.Factory.CreateUsingRabbitMq(busConfigurator =>
            {
                busConfigurator.Host(host, hostConfigurator =>
                {
                    hostConfigurator.Username(userName);
                    hostConfigurator.Password(password);
                });

                initializer?.Invoke(busConfigurator);
            });

            return bus;
        }
    }
}