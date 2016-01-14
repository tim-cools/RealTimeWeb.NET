using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Membership.Messages.Clients
{
    public class ClientValidator : IMessage<ValidateClientResult>
    {
        public string ClientId { get; }
        public string ClientSecret { get; }

        public ClientValidator(string clientId, string clientSecret)
        {
            ClientId = clientId;
            ClientSecret = clientSecret;
        }
    }
}