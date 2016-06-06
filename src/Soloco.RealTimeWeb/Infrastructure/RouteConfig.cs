using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public static class RouteConfig
    {
        public static void RegisterRoutes(this IRouteBuilder routeBuilder)
        {
            //routeBuilder.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routeBuilder.MapRoute(
                name: "Default",
                template: "", 
                defaults: new { controller = "Home", action = "Index" });
            routeBuilder. MapRoute(name: "Account", template: "Account/{action}", defaults: new { controller = "Account" });
        }
    }
}
