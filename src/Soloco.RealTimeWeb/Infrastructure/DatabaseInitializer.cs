using System;
using MassTransit.RabbitMqTransport;
using Microsoft.AspNet.Builder;
using Soloco.RealTimeWeb.Membership.Messages.Infrastructure;

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
}
