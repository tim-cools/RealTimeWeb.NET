using System;
using MassTransit;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common.MessageBus;
using Soloco.RealTimeWeb.Infrastructure.VehicleMonitor;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public static class BusInitializer
    {
        public static IApplicationBuilder InitalizeBus(this IApplicationBuilder app, IConfiguration configuration, IApplicationLifetime lifetime)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            if (lifetime == null) throw new ArgumentNullException(nameof(lifetime));

            var busControl = BusFactory.CreateBus(configuration, busConfigurator => 
            {
                busConfigurator.ReceiveEndpoint("Soloco.RealTimeWeb", endpointConfiguration =>
                {
                    endpointConfiguration.Consumer(() => new VehicleMonitoConsumer());
                });
            });

            if (busControl != null)
            {
                var busHandle = busControl.Start();

                //todo: handler the bus lifetime by the container
                lifetime.ApplicationStopping.Register(() => { busHandle.Dispose(); });
            }

            return app;
        }
    }
}