using Microsoft.AspNet.Authentication.Facebook;
using Microsoft.AspNet.Authentication.Google;

namespace Soloco.RealTimeWeb.Membership.Services
{
    public class OAuthConfiguration : IOAuthConfiguration
    {
        public GoogleOptions Google { get; }
        public FacebookOptions Facebook { get; }

        public OAuthConfiguration()
        {
            Google = new GoogleOptions()
            {
                ClientId = "342962424267-h6dfsc4sgn0spf9fk6506d3iqf8ul8fj.apps.googleusercontent.com",
                ClientSecret = "hhg69bsNeCTEAYJRADRuCOgq",
            };

            Facebook = new FacebookOptions()
            {
                AppId = "1648062998809846",
                AppSecret = "c0401541376309eba60190b8999ed048",
            };
        }
    }
}