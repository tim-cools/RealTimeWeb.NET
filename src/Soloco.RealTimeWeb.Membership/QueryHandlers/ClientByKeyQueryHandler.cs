using System;
using System.Threading.Tasks;
using Marten;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class ClientByKeyQueryHandler : QueryHandler<ClientByKeyQuery, Client>
    {
        public ClientByKeyQueryHandler(IQuerySession session)
              : base(session)
        {
        }

        protected override Task<Client> Execute(ClientByKeyQuery query)
        { 
            var result = Session.GetFirst<Domain.Client>(criteria => criteria.Key == query.ClientId);
            return Task.FromResult(result != null ? Map(result) : null);
        }

        private static Client Map(Domain.Client result)
        {
            return new Client
            {
                AllowedOrigin = result.AllowedOrigin,
                Id = result.Id,
                Name = result.Name
            };
        }
    }
}