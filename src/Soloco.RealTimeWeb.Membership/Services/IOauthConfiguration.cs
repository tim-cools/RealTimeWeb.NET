using Microsoft.Owin.Security.Facebook;
using Microsoft.Owin.Security.Google;
using Microsoft.Owin.Security.OAuth;

namespace Soloco.RealTimeWeb.Membership.Services
{
    public interface IOAuthConfiguration
    {
        OAuthBearerAuthenticationOptions Bearer { get; }
        GoogleOAuth2AuthenticationOptions Google { get; }
        FacebookAuthenticationOptions Facebook { get; }
    }
}