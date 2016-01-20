using System;
using MassTransit;
using MassTransit.RabbitMqTransport;
using Microsoft.AspNet.Builder;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common.MessageBus;
using Soloco.RealTimeWeb.Membership.Messages.Infrastructure;
using Soloco.RealTimeWeb.VehicleMonitor.Messages.Vehicle;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public static class DatabaseInitializer
    {
        public static IApplicationBuilder InitalizeDatabase(this IApplicationBuilder app)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));

            var messageDispatcher = app.ApplicationServices.GetMessageDispatcher();
            var command = new InitializeDatabaseCommand();

            messageDispatcher.Execute(command);

            return app;
        }
    }

    public static class BusInitializer
    {
        public static BusHandle InitalizeBus(this IApplicationBuilder app, IConfiguration configuration)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));

            var busControl = BusFactory.CreateBus(configuration, busConfigurator => 
            {
                busConfigurator.ReceiveEndpoint("Soloco.RealTimeWeb", endpointConfiguration =>
                {
                    endpointConfiguration.Consumer(() => new VehicleDrivingConsumer());
                });
            });

            return busControl.Start();
        }
    }

    public class VehicleDrivingConsumer : IConsumer<VehicleDriving>
    {
    }
}
