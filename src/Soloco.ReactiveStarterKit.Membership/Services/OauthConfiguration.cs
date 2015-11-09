using Microsoft.Owin.Security.Facebook;
using Microsoft.Owin.Security.Google;
using Microsoft.Owin.Security.OAuth;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public class OAuthConfiguration : IOAuthConfiguration
    {
        public OAuthBearerAuthenticationOptions Bearer { get; }
        public GoogleOAuth2AuthenticationOptions Google { get; }
        public FacebookAuthenticationOptions Facebook { get; }

        public OAuthConfiguration()
        {
            Bearer = new OAuthBearerAuthenticationOptions();

            Google = new GoogleOAuth2AuthenticationOptions()
            {
                ClientId = "342962424267-h6dfsc4sgn0spf9fk6506d3iqf8ul8fj.apps.googleusercontent.com",
                ClientSecret = "hhg69bsNeCTEAYJRADRuCOgq",
                Provider = new GoogleAuthProvider()
            };

            Facebook = new FacebookAuthenticationOptions()
            {
                AppId = "1648062998809846",
                AppSecret = "c0401541376309eba60190b8999ed048",
                Provider = new FacebookAuthProvider()
            };
        }
    }
}