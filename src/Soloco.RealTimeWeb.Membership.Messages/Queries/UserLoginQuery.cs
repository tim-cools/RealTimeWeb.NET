using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Queries
{
    public class UserLoginQuery : IMessage<UserLogin>
    {
        public LoginProvider LoginProvider { get; private set; }   //todo private setter is necessary for the Mono build, otherwise it fails with a  CS0118
        public string ProviderKey { get; }

        public UserLoginQuery(LoginProvider loginProvider, string providerKey)
        {
            LoginProvider = loginProvider;
            ProviderKey = providerKey;
        }
    }
}