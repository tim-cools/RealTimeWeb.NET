using System;
using System.Web.Http;
using Microsoft.Owin;
using Microsoft.Owin.Security.OAuth;
using Owin;
using Soloco.RealTimeWeb.Membership.Services;
using Soloco.RealTimeWeb.Providers;

namespace Soloco.RealTimeWeb
{
    public static class OAuthConfig
    {
        public static IAppBuilder ConfigureOAuth(this IAppBuilder app, HttpConfiguration httpConfiguration)
        {
            var options =
                (IOAuthConfiguration) httpConfiguration.DependencyResolver.GetService(typeof (IOAuthConfiguration));
                
            //use a cookie to temporarily store information about a user logging in with a third party login provider
            app.UseExternalSignInCookie(Microsoft.AspNet.Identity.DefaultAuthenticationTypes.ExternalCookie);

            var serverOptions = CreateOptions(httpConfiguration);
            app
                .UseOAuthAuthorizationServer(serverOptions)
                .UseOAuthBearerAuthentication(options.Bearer)
                .UseFacebookAuthentication(options.Facebook)
                .UseGoogleAuthentication(options.Google);

            return app;
        }

        private static OAuthAuthorizationServerOptions CreateOptions(HttpConfiguration httpConfiguration)
        {
            return new OAuthAuthorizationServerOptions
            {
                AllowInsecureHttp = true,
                TokenEndpointPath = new PathString("/token"),
                AccessTokenExpireTimeSpan = TimeSpan.FromMinutes(30),
                Provider = new AuthorizationServerProvider(httpConfiguration.DependencyResolver),
                RefreshTokenProvider = new RefreshTokenProvider(httpConfiguration.DependencyResolver)
            };
        }        
    }
}
