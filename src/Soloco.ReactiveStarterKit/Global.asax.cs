using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Http;

namespace Soloco.ReactiveStarterKit
{
    public class Global : HttpApplication
    {
        void Application_Start(object sender, EventArgs e)
        {
            AreaRegistration.RegisterAllAreas();
            GlobalConfiguration.Configure(WebApiConfig.RegisterWebApi);
            RouteConfig.RegisterRoutes(RouteTable.Routes);            
        }
    }
}