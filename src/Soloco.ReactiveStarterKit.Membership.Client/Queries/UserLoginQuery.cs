using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;
using Soloco.ReactiveStarterKit.Membership.Client.Model;

namespace Soloco.ReactiveStarterKit.Membership.Client.Queries
{
    public class UserLoginQuery : IMessage<UserLogin>
    {
        public string LoginProvider { get; }
        public string ProviderKey { get; }

        public UserLoginQuery(string loginProvider, string providerKey)
        {
            LoginProvider = loginProvider;
            ProviderKey = providerKey;
        }
    }
}