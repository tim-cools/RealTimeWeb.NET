using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Formatting;
using System.Web.Http;
using Newtonsoft.Json.Serialization;

namespace Soloco.ReactiveStarterKit
{
    public static class WebApiConfig
    {
        public static void RegisterWebApi(this HttpConfiguration config)
        {
            config
                .MapRoutes()
                .FormatJsonCamelCase();
        }

        private static HttpConfiguration MapRoutes(this HttpConfiguration config)
        {
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new {id = RouteParameter.Optional}
                );

            return config;
        }

        private static void FormatJsonCamelCase(this HttpConfiguration config)
        {
            var jsonFormatter = config.Formatters.OfType<JsonMediaTypeFormatter>().First();
            jsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
        }
    }
}
