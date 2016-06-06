using System;
using System.Net.Http;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNet.Http;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public static class AuthenticationConfiguration
    {
        public static IApplicationBuilder ConfigureAuthentication(this IApplicationBuilder app, IConfiguration configuration)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));

            app 
                .UseWhen(IsApi, ApiAuthentication(configuration))
                .UseWhen(IsWeb, WebAuthentication)
                .ConfigureWhen(configuration.AuthenticationFacebookConfigured(), FacebookAuthentication(configuration))
                .ConfigureWhen(configuration.AuthenticationGoogleConfigured(), GoogleAuthentication(configuration))
                .UseOpenIdConnectServer(ServerOptions);

            return app;
        }

        private static bool IsApi(HttpContext context)
        {
            return context.Request.Path.StartsWithSegments(new PathString("/api"));
        }

        private static Action<IApplicationBuilder> ApiAuthentication(IConfiguration configuration)
        {
            return branch => branch.UseJwtBearerAuthentication(options =>
            {
                options.AutomaticAuthenticate = true;
                options.AutomaticChallenge = true;
                options.RequireHttpsMetadata = false;

                options.Audience = configuration.ApiHostName();
                options.Authority = configuration.ApiHostName();
            });
        }

        private static bool IsWeb(HttpContext context)
        {
            return !IsApi(context);
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

        private static Action<IApplicationBuilder> GoogleAuthentication(IConfiguration configuration)
        {
            return app => app.UseGoogleAuthentication(options =>
            {
                options.ClientId = configuration.AuthenticationGoogleClientId();
                options.ClientSecret = configuration.AuthenticationGoogleClientSecret();
            });
        }

        private static Action<IApplicationBuilder> FacebookAuthentication(IConfiguration configuration)
        {
            return app => app.UseFacebookAuthentication(options =>
            {
                options.AppId = configuration.AuthenticationFacebookAppId();
                options.AppSecret = configuration.AuthenticationFacebookAppSecret();
                options.BackchannelHttpHandler = new HttpClientHandler();
                options.UserInformationEndpoint = "https://graph.facebook.com/v2.5/me?fields=id,name,email";
                options.Scope.Add("email");
            });
        }

        private static void ServerOptions(OpenIdConnectServerOptions options)
        {
            options.Provider = new AuthorizationServerProvider();
            options.AllowInsecureHttp = true;
            options.AuthorizationEndpointPath = "/account/authorize";
            options.TokenEndpointPath = "/token";

            options.AccessTokenLifetime = TimeSpan.FromMinutes(20);
            options.RefreshTokenLifetime = TimeSpan.FromHours(24);
        }
    }
}
