using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Queries
{
    public class ValidateClientAuthenticationQuery : IMessage<ValidateClientAuthenticationResult>
    {
        public string ClientId { get; }
        public string ClientSecret { get; }

        public ValidateClientAuthenticationQuery(string clientId, string clientSecret)
        {
            ClientId = clientId;
            ClientSecret = clientSecret;
        }
    }
}