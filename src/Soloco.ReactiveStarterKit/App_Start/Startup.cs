using System.Web.Http;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Owin;
using Soloco.ReactiveStarterKit;
using Soloco.ReactiveStarterKit.Common;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;
using Soloco.ReactiveStarterKit.Membership;
using Soloco.ReactiveStarterKit.Membership.Client;

[assembly: OwinStartup(typeof(Startup))]

namespace Soloco.ReactiveStarterKit
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            var httpConfiguration = HttpConfiguration();
            app
                .UseWebApi(httpConfiguration)
                .ConfigureOAuth(httpConfiguration)
                .UseCors(Microsoft.Owin.Cors.CorsOptions.AllowAll)
                .MapSignalR("/sockets", new HubConfiguration());
        }

        private static HttpConfiguration HttpConfiguration()
        {
            return new HttpConfiguration()
                .MapRoutes()
                .FormatJsonCamelCase()
                .RegisterDependencyResolver(configure => configure
                    .RegisterCommon()
                    .RegisterMembership()
                    .RegisterMembershipClient()
                    .RegisterApiControllers()
                );
        }
    }
}