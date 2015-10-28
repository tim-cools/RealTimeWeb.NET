using System;
using System.Web.Http;
using Microsoft.Owin;
using Microsoft.Owin.Security.Facebook;
using Microsoft.Owin.Security.Google;
using Microsoft.Owin.Security.OAuth;
using Owin;
using Soloco.ReactiveStarterKit.Providers;

namespace Soloco.ReactiveStarterKit
{
    public static class OAuthConfig
    {
        public static OAuthBearerAuthenticationOptions OAuthBearerOptions { get; private set; }
        public static GoogleOAuth2AuthenticationOptions googleAuthOptions { get; private set; }
        public static FacebookAuthenticationOptions facebookAuthOptions { get; private set; }

        public static IAppBuilder ConfigureOAuth(this IAppBuilder app, HttpConfiguration httpConfiguration)
        {
            //use a cookie to temporarily store information about a user logging in with a third party login provider
            app.UseExternalSignInCookie(Microsoft.AspNet.Identity.DefaultAuthenticationTypes.ExternalCookie);

            var OAuthServerOptions = CreateOptions(httpConfiguration);
            app.UseOAuthAuthorizationServer(OAuthServerOptions);
            app.UseOAuthBearerAuthentication(OAuthBearerOptions);

            ConfigureGoogle(app);
            ConfigureFacebook(app);

            return app;
        }

        private static OAuthAuthorizationServerOptions CreateOptions(HttpConfiguration httpConfiguration)
        {
            OAuthBearerOptions = new OAuthBearerAuthenticationOptions
            {
                
            };

            var OAuthServerOptions = new OAuthAuthorizationServerOptions
            {
                AllowInsecureHttp = true,
                TokenEndpointPath = new PathString("/token"),
                AccessTokenExpireTimeSpan = TimeSpan.FromMinutes(30),
                Provider = new SimpleAuthorizationServerProvider(httpConfiguration.DependencyResolver),
                RefreshTokenProvider = new SimpleRefreshTokenProvider(httpConfiguration.DependencyResolver)
            };
            return OAuthServerOptions;
        }

        private static void ConfigureGoogle(IAppBuilder app)
        {
            //Configure Google External Login
            googleAuthOptions = new GoogleOAuth2AuthenticationOptions()
            {
                ClientId = "342962424267-h6dfsc4sgn0spf9fk6506d3iqf8ul8fj.apps.googleusercontent.com",
                ClientSecret = "hhg69bsNeCTEAYJRADRuCOgq",
                Provider = new GoogleAuthProvider()
            };
            app.UseGoogleAuthentication(googleAuthOptions);
        }

        private static void ConfigureFacebook(IAppBuilder app)
        {
            //Configure Facebook External Login
            facebookAuthOptions = new FacebookAuthenticationOptions()
            {
                AppId = "1648062998809846",
                AppSecret = "c0401541376309eba60190b8999ed048",
                Provider = new FacebookAuthProvider()
            };
            app.UseFacebookAuthentication(facebookAuthOptions);
        }
    }
}
