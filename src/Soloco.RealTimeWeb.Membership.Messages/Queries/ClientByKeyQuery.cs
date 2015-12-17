using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Queries
{
    public class ClientByKeyQuery : IMessage<Client>
    {
        public string ClientId { get; }

        public ClientByKeyQuery(string clientId)
        {
            ClientId = clientId;
        }
    }
}