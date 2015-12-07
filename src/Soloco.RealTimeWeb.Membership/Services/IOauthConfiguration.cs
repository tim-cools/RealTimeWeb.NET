using Microsoft.AspNet.Authentication.Facebook;
using Microsoft.AspNet.Authentication.Google;

namespace Soloco.RealTimeWeb.Membership.Services
{
    public interface IOAuthConfiguration
    {
        GoogleOptions Google { get; }
        FacebookOptions Facebook { get; }
    }
}