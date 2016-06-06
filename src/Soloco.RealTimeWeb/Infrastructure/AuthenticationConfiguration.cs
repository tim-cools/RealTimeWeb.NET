using System;
using System.Net.Http;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
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
            return branch => branch.UseJwtBearerAuthentication(new JwtBearerOptions
            {
                AutomaticAuthenticate = true,
                AutomaticChallenge = true,
                RequireHttpsMetadata = false,

                Audience = configuration.ApiHostName(),
                Authority = configuration.ApiHostName()
            });
        }

        private static bool IsWeb(HttpContext context)
        {
            return !IsApi(context);
        }

        private static void WebAuthentication(IApplicationBuilder branch)
        {
            branch.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AutomaticAuthenticate = true,
                AutomaticChallenge = true,
                AuthenticationScheme = "ServerCookie",
                CookieName = CookieAuthenticationDefaults.CookiePrefix + "ServerCookie",
                ExpireTimeSpan = TimeSpan.FromMinutes(5),
                LoginPath = new Microsoft.AspNetCore.Http.PathString(new PathString("/signin"))
            });
        }

        private static Action<IApplicationBuilder> GoogleAuthentication(IConfiguration configuration)
        {
            return app => app.UseGoogleAuthentication(new GoogleOptions
            {
                ClientId = configuration.AuthenticationGoogleClientId(),
                ClientSecret = configuration.AuthenticationGoogleClientSecret()
            });
        }

        private static Action<IApplicationBuilder> FacebookAuthentication(IConfiguration configuration)
        {
            var options = new FacebookOptions
            {
                AppId = configuration.AuthenticationFacebookAppId(),
                AppSecret = configuration.AuthenticationFacebookAppSecret(),
                BackchannelHttpHandler = new HttpClientHandler(),
                UserInformationEndpoint = "https://graph.facebook.com/v2.5/me?fields=id,name,email",
            };

            options.Scope.Add("email");

            return app => app.UseFacebookAuthentication(options);
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
