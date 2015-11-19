using System.Web.Http;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Owin;
using Soloco.ReactiveStarterKit;
using Soloco.ReactiveStarterKit.Common;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;
using Soloco.ReactiveStarterKit.Membership;
using Soloco.ReactiveStarterKit.Membership.Client;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using IDependencyResolver = System.Web.Http.Dependencies.IDependencyResolver;

[assembly: OwinStartup(typeof(Startup))]

namespace Soloco.ReactiveStarterKit
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            LoggingInitializer.Initialize();

            var httpConfiguration = HttpConfiguration();
            app
                .ConfigureOAuth(httpConfiguration)
                .UseWebApi(httpConfiguration)
                .UseCors(Microsoft.Owin.Cors.CorsOptions.AllowAll)
                .MapSignalR("/sockets", new HubConfiguration());

            InitializeDatabase(httpConfiguration.DependencyResolver);
        }

        private static void InitializeDatabase(IDependencyResolver dependencyResolver)
        {
            var messageDispatcher = dependencyResolver.GetMessageDispatcher(); 

            var command = new InitializeDatabaseCommand();
            messageDispatcher.Execute(command).Wait();
        }

        private static HttpConfiguration HttpConfiguration()
        {
            return new HttpConfiguration()
                .MapRoutes()
                .FormatJsonCamelCase()
                .RegisterDependencyResolver(configure => configure
                    .RegisterCommon()
                    .RegisterMembership()
                    .RegisterMembershipViews()
                    .RegisterApiControllers()
                );
        }
    }
}