using System;
using System.Net.Http;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNet.Authentication.Facebook;
using Microsoft.AspNet.Authentication.Google;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Http;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public static class AuthenticationConfiguration
    {
        public static IApplicationBuilder ConfigureAuthentication(this IApplicationBuilder app)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));

            app
               .UseIdentity()
               .UseWhen(IsApi, ApiAuthentication)
               .UseWhen(IsWeb, WebAuthentication)
               .UseFacebookAuthentication(FacebookOptions)
               .UseGoogleAuthentication(GoogleOptions)
               .UseOpenIdConnectServer(ServerOptions(app.ApplicationServices));

            return app;
        }

        private static bool IsWeb(HttpContext context)
        {
            return !IsApi(context);
        }

        private static void ApiAuthentication(IApplicationBuilder branch)
        {
            branch.UseJwtBearerAuthentication(options =>
            {
                options.AutomaticAuthenticate = true;
                options.AutomaticChallenge = true;
                options.RequireHttpsMetadata = false;
                options.Audience = Configuration.AuthenticationResource;
                options.Authority = Configuration.AuthenticationResource;
            });
        }

        private static bool IsApi(HttpContext context)
        {
            return context.Request.Path.StartsWithSegments(new PathString("/api"));
        }

        private static void WebAuthentication(IApplicationBuilder branch)
        {
            branch.UseCookieAuthentication(options =>
            {
                options.AutomaticAuthenticate = true;
                options.AutomaticChallenge = true;
                options.AuthenticationScheme = "ServerCookie";
                options.CookieName = CookieAuthenticationDefaults.CookiePrefix + "ServerCookie";
                options.ExpireTimeSpan = TimeSpan.FromMinutes(5);
                options.LoginPath = new PathString("/signin");
            });
        }

        private static void GoogleOptions(GoogleOptions options)
        {
            //todo remove from git and put in use specific env var's (or somthing else)
            options.ClientId = "342962424267-h6dfsc4sgn0spf9fk6506d3iqf8ul8fj.apps.googleusercontent.com";
            options.ClientSecret = "hhg69bsNeCTEAYJRADRuCOgq";
        }

        private static void FacebookOptions(FacebookOptions options)
        {
            //todo remove from git and put in use specific env var's (or somthing else)
            options.AppId = "1648062998809846";
            options.AppSecret = "c0401541376309eba60190b8999ed048";

            options.Scope.Add("email");
            options.BackchannelHttpHandler = new HttpClientHandler();
            options.UserInformationEndpoint = "https://graph.facebook.com/v2.5/me?fields=id,name,email";
        }

        private static Action<OpenIdConnectServerOptions> ServerOptions(IServiceProvider serviceProvider)
        {
            return options =>
            {
                options.Provider = new AuthorizationServerProvider(serviceProvider);
                options.AllowInsecureHttp = true;
                options.AuthorizationEndpointPath = "/account/authorize";
                options.TokenEndpointPath = "/token";

                options.IdentityTokenLifetime = TimeSpan.FromMinutes(1);
                options.AccessTokenLifetime = TimeSpan.FromMinutes(1);
                options.RefreshTokenLifetime = TimeSpan.FromHours(24);
            };
        }
    }
}
