using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Queries
{
    public class UserLoginQuery : IMessage<UserLogin>
    {
        public LoginProvider LoginProvider { get; }
        public string ProviderKey { get; }

        public UserLoginQuery(LoginProvider loginProvider, string providerKey)
        {
            LoginProvider = loginProvider;
            ProviderKey = providerKey;
        }
    }
}