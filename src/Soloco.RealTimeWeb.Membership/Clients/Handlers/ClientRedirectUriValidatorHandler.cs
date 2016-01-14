using System.Threading.Tasks;
using Marten;
using Serilog;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Membership.Messages.Clients;

namespace Soloco.RealTimeWeb.Membership.Clients.Handlers
{
    public class ClientRedirectUriValidatorHandler : QueryHandler<ClientRedirectUriValidator, Result>
    {
        public ClientRedirectUriValidatorHandler(IQuerySession session)
              : base(session)
        {
        }

        protected override Task<Result> Execute(ClientRedirectUriValidator query)
        {
            return Task.FromResult(GetResult(query));
        }

        private Result GetResult(ClientRedirectUriValidator query)
        {
            var client = Session.GetFirst<Domain.Client>(criteria => criteria.Key == query.ClientId);
            if (client == null)
            {
                return Result.Failed($"Client '{query.ClientId}' is not registered in the system.");
            }

            if (client.RedirectUri != "*" && client.RedirectUri != query.RedirectUri)
            {
                return Result.Failed($"Invalid redirect uri '{query.RedirectUri} for client '{query.ClientId}'");
            }

            if (!client.Active)
            {
                return Result.Failed("Client is inactive.");
            }

            return Result.Success;
        }
    }
}