using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin.Builder;
using Owin;

namespace Soloco.RealTimeWeb.Infrastructure
{
    using AppFunc = Func<IDictionary<string, object>, Task>;

    public static class SignalRExtensions
    {
        private static IApplicationBuilder UseAppBuilder(
            this IApplicationBuilder app,
            Action<IAppBuilder> configure)
        {
            app.UseOwin(addToPipeline =>
            {
                addToPipeline(next =>
                {
                    var appBuilder = new AppBuilder();
                    appBuilder.Properties["builder.DefaultApp"] = next;

                    configure(appBuilder);

                    return appBuilder.Build<AppFunc>();
                });
            });

            return app;
        }

        public static IApplicationBuilder UseSignalR(this IApplicationBuilder app, HubConfiguration configuration = null)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            app.UseAppBuilder(appBuilder => appBuilder.MapSignalR(configuration ?? new HubConfiguration()));
            return app;
        }
    }
}