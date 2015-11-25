using System;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Infrastructure.Store;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class ClientByKeyQueryHandler : QueryHandler<ClientByKeyQuery, Client>
    {
        public ClientByKeyQueryHandler(IQuerySession session, IDisposable scope)
              : base(session, scope)
        {
        }

        protected override async Task<Client> Execute(ClientByKeyQuery query)
        { 
            var result = Session.GetFirst<Domain.Client>(criteria => criteria.Key == query.ClientId);
            return result != null ? Map(result) : null;
        }

        private static Client Map(Domain.Client result)
        {
            return new Client
            {
                AllowedOrigin = result.AllowedOrigin
            };
        }
    }
}