using System;
using AspNet.Security.OAuth.Validation;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Http;
using Soloco.RealTimeWeb.Membership.Services;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public static class OAuthConfig
    {
        public static IApplicationBuilder ConfigureOAuth(this IApplicationBuilder app)
        {
            var applicationServices = app.ApplicationServices;
            var oauthCOnfiguration = new OAuthConfiguration();

            app
               .UseIdentity()
               .UseWhen(IsApi, ApiAuthentication)
               .UseWhen(IsWeb, WebAuthentication)
               .UseFacebookAuthentication(oauthCOnfiguration.Facebook)
               .UseGoogleAuthentication(oauthCOnfiguration.Google)
               .UseOpenIdConnectServer(ServerOptions(applicationServices));

            return app;
        }

        private static bool IsWeb(HttpContext context)
        {
            return !IsApi(context);
        }

        private static bool IsApi(HttpContext context)
        {
            return context.Request.Path.StartsWithSegments(new PathString("/api"));
        }

        private static void WebAuthentication(IApplicationBuilder branch)
        {
            branch.UseCookieAuthentication(new CookieAuthenticationOptions {
                AutomaticAuthenticate = true,
                AutomaticChallenge = true,
                AuthenticationScheme = "ServerCookie",
                CookieName = CookieAuthenticationDefaults.CookiePrefix + "ServerCookie",
                ExpireTimeSpan = TimeSpan.FromMinutes(5),
                LoginPath = new PathString("/signin")
            });
        }

        private static void ApiAuthentication(IApplicationBuilder branch)
        {
            branch.UseJwtBearerAuthentication(options =>
            {
                options.AutomaticAuthenticate = true;
                options.AutomaticChallenge = true;
                options.RequireHttpsMetadata = false;
                options.Audience = "http://localhost:3000/";
                options.Authority = "http://localhost:3000/";
            });
        }

        private static Action<OpenIdConnectServerOptions> ServerOptions(IServiceProvider serviceProvider)
        {
            return options =>
            {
                options.Provider = new AuthorizationServerProvider(serviceProvider);
                options.AllowInsecureHttp = true;
                options.AuthorizationEndpointPath = "/account/authorize";
                options.TokenEndpointPath = "/token";
                options.AccessTokenLifetime = TimeSpan.FromMinutes(30);
            };
        }
    }
}
