using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Queries
{
    public class ClientByKeyQuery : IMessage<ClientInfo>
    {
        public string ClientId { get; }

        public ClientByKeyQuery(string clientId)
        {
            ClientId = clientId;
        }
    }
}