using System;
using System.Linq;
using System.Net.Http.Formatting;
using System.Web.Http;
using Newtonsoft.Json.Serialization;

namespace Soloco.RealTimeWeb
{
    public static class WebApiConfig
    {
        internal static HttpConfiguration MapRoutes(this HttpConfiguration config)
        {
            if (config == null) throw new ArgumentNullException(nameof(config));

            config.MapHttpAttributeRoutes();

            config.EnableSystemDiagnosticsTracing();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new {id = RouteParameter.Optional}
                );

            return config;
        }

        internal static HttpConfiguration FormatJsonCamelCase(this HttpConfiguration config)
        {
            if (config == null) throw new ArgumentNullException(nameof(config));

            var jsonFormatter = config.Formatters.OfType<JsonMediaTypeFormatter>().First();
            jsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            return config;
        }
    }
}
