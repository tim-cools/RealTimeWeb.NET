using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Queries
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