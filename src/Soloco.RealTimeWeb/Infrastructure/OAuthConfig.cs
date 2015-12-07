using System;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Authentication.Cookies;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.Http;
using Soloco.RealTimeWeb.Membership.Services;
using Soloco.RealTimeWeb.Providers;

namespace Soloco.RealTimeWeb
{
    public static class OAuthConfig
    {
        public static IApplicationBuilder ConfigureOAuth(this IApplicationBuilder app)
        {
            var applicationServices = app.ApplicationServices;
            var oauthCOnfiguration =
                (IOAuthConfiguration)applicationServices.GetService(typeof(IOAuthConfiguration));

            //use a cookie to temporarily store information about a user logging in with a third party login provider
            //app.UseExternalSignInCookie(Microsoft.AspNet.Identity.DefaultAuthenticationTypes.ExternalCookie);

            app
                .UseWhen(context => context.Request.Path.StartsWithSegments(new PathString("/api")), ApiAuthentication(oauthCOnfiguration))
                .UseWhen(context => !context.Request.Path.StartsWithSegments(new PathString("/api")), WenAuthentication(oauthCOnfiguration))
                .UseOpenIdConnectServer(ServerOptions(applicationServices));

            return app;
        }

        private static Action<IApplicationBuilder> WenAuthentication(IOAuthConfiguration oauthCOnfiguration)
        {
            return branch =>
            {
                // Insert a new cookies middleware in the pipeline to store
                // the user identity returned by the external identity provider.
                branch.UseCookieAuthentication(options =>
                {
                    options.AutomaticAuthenticate = true;
                    options.AutomaticChallenge = true;
                    options.AuthenticationScheme = "ServerCookie";
                    options.CookieName = CookieAuthenticationDefaults.CookiePrefix + "ServerCookie";
                    options.ExpireTimeSpan = TimeSpan.FromMinutes(5);
                    options.LoginPath = new PathString("/signin");
                });

                branch.UseFacebookAuthentication(oauthCOnfiguration.Facebook);
                branch.UseGoogleAuthentication(oauthCOnfiguration.Google);
                //branch.UseTwitterAuthentication(oauthCOnfiguration.Twiiter);
            };
        }

        private static Action<IApplicationBuilder> ApiAuthentication(IOAuthConfiguration oauthCOnfiguration)
        {
            return branch =>
            {
                branch.UseJwtBearerAuthentication(options =>
                {
                    options.AutomaticAuthenticate = true;
                    options.AutomaticChallenge = true;
                    options.RequireHttpsMetadata = false;

                    options.Audience = "http://localhost:54540/";
                    options.Authority = "http://localhost:54540/";
                });
            };
        }

        private static Action<OpenIdConnectServerOptions> ServerOptions(IServiceProvider serviceProvider)
        {
            return options =>
            {
                options.AllowInsecureHttp = true;
                options.TokenEndpointPath = "/token";
                options.AccessTokenLifetime = TimeSpan.FromMinutes(30);
                options.Provider = new AuthorizationServerProvider(serviceProvider);
            };
        }

    }
    public static class AppBuilderExtensions
    {
        public static IApplicationBuilder UseWhen(this IApplicationBuilder app,
            Func<HttpContext, bool> condition, Action<IApplicationBuilder> configuration)
        {
            if (app == null)
            {
                throw new ArgumentNullException(nameof(app));
            }

            if (condition == null)
            {
                throw new ArgumentNullException(nameof(condition));
            }

            if (configuration == null)
            {
                throw new ArgumentNullException(nameof(configuration));
            }

            var builder = app.New();
            configuration(builder);

            return app.Use(next =>
            {
                builder.Run(next);

                var branch = builder.Build();

                return context =>
                {
                    if (condition(context))
                    {
                        return branch(context);
                    }

                    return next(context);
                };
            });
        }
    }
}
