using System.Threading.Tasks;
using Marten;
using Serilog;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Security;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Membership.Clients.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Clients;

namespace Soloco.RealTimeWeb.Membership.Clients.Handlers
{
    public class ClientValidatorHandler : QueryHandler<ClientValidator, ValidateClientResult>
    {
        public ClientValidatorHandler(IQuerySession session)
              : base(session)
        {
        }

        protected override Task<ValidateClientResult> Execute(ClientValidator query)
        {
            return Task.FromResult(GetResult(query));
        }

        private ValidateClientResult GetResult(ClientValidator query)
        {
            var client = Session.GetFirst<Domain.Client>(criteria => criteria.Key == query.ClientId);
            if (client == null)
            {
                return ValidateClientResult.Failed($"Client '{query.ClientId}' is not registered in the system.");
            }

            if (client.ApplicationType == ApplicationTypes.NativeConfidential)
            {
                if (string.IsNullOrWhiteSpace(query.ClientSecret))
                {
                    return ValidateClientResult.Failed("Client secret should be sent.");
                }
                if (client.Secret != Hasher.ComputeSHA256(query.ClientSecret))
                {
                    return ValidateClientResult.Failed("Client secret is invalid.");
                }
            }

            if (!client.Active)
            {
                return ValidateClientResult.Failed("Client is inactive.");
            }

            return new ValidateClientResult(true, client.Id, client.Name, client.AllowedOrigin, client.RedirectUri);
        }
    }
}