using System;
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

            app.UseIdentity();

            WebAuthentication()(app);

            app
              //  .UseWhen(IsApi, ApiAuthentication(oauthCOnfiguration))
                //.UseWhen(IsWeb, WebAuthentication(oauthCOnfiguration))
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

        private static Action<IApplicationBuilder> WebAuthentication()
        {
            return branch =>
            {
                // Insert a new cookies middleware in the pipeline to store
                // the user identity returned by the external identity provider.
                var options = new CookieAuthenticationOptions {
                    AutomaticAuthenticate = true,
                    AutomaticChallenge = true,
                    AuthenticationScheme = "ServerCookie",
                    CookieName = CookieAuthenticationDefaults.CookiePrefix + "ServerCookie",
                    ExpireTimeSpan = TimeSpan.FromMinutes(5),
                    LoginPath = new PathString("/signin")
                };

                branch.UseCookieAuthentication(options);
            };
        }

        private static Action<IApplicationBuilder> ApiAuthentication(IOAuthConfiguration oauthCOnfiguration)
        {
            return branch =>
            {
                //branch.UseOAuthValidation(options => {
                //    options.AutomaticAuthenticate = true;
                //    options.AutomaticChallenge = true;
                //});

                //branch.UseJwtBearerAuthentication(options =>
                //{
                //    options.AutomaticAuthenticate = true;
                //    options.AutomaticChallenge = true;
                //    options.RequireHttpsMetadata = false;

                //    options.Audience = "http://localhost:54540/";
                //    options.Authority = "http://localhost:54540/";
                //});
            };
        }

        private static Action<OpenIdConnectServerOptions> ServerOptions(IServiceProvider serviceProvider)
        {
            return options =>
            {
                options.Provider = new AuthorizationServerProvider(serviceProvider);
                options.AllowInsecureHttp = true;
                options.AuthorizationEndpointPath = "/account/authorize/";
                options.TokenEndpointPath = "/token";
                options.AccessTokenLifetime = TimeSpan.FromMinutes(30);
            };
        }
    }
}
