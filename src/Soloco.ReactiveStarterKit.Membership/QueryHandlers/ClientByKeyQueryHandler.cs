using System;
using System.Threading.Tasks;
using Marten;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Store;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.QueryHandlers
{
    public class ClientByKeyQueryHandler : IHandleMessage<ClientByKeyQuery, ClientInfo>
    {
        private readonly IDocumentSession _session;
        private readonly IDisposable _scope;

        public ClientByKeyQueryHandler(IDocumentSession session, IDisposable scope)
        {
            _session = session;
            _scope = scope;
        }

        public async Task<ClientInfo> Handle(ClientByKeyQuery query)
        {
            using (_scope)
            {
                var result = _session.GetFirst<Domain.Client>(criteria => criteria.Key == query.ClientId);
                return result != null ? Map(result) : null;
            }
        }

        private static ClientInfo Map(Domain.Client result)
        {
            return new ClientInfo
            {
                AllowedOrigin = result.AllowedOrigin
            };
        }
    }
}