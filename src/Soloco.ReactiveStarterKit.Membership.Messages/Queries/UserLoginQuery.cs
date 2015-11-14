using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Queries
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