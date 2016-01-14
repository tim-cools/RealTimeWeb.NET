using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.Clients
{
    public class ClientRedirectUriValidator : IMessage<Result>
    {
        public string ClientId { get; }
        public string RedirectUri { get; }

        public ClientRedirectUriValidator(string clientId, string redirectUri)
        {
            ClientId = clientId;
            RedirectUri = redirectUri;
        }
    }
}