using System;
using System.Threading.Tasks;
using Marten;
using Serilog;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Security;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class ValidateClientAuthenticationHandler : QueryHandler<ValidateClientAuthenticationQuery, ValidateClientAuthenticationResult>
    {
        public ValidateClientAuthenticationHandler(IQuerySession session)
              : base(session)
        {
        }

        protected override Task<ValidateClientAuthenticationResult> Execute(ValidateClientAuthenticationQuery query)
        {
            return Task.FromResult(GetResult(query));
        }

        private ValidateClientAuthenticationResult GetResult(ValidateClientAuthenticationQuery query)
        {
            var client = Session.GetFirst<Domain.Client>(criteria => criteria.Key == query.ClientId);
            if (client == null)
            {
                Log.Warning($"Client '{query.ClientId}' is not registered in the system.");
                return new ValidateClientAuthenticationResult(false);
            }

            if (client.ApplicationType == ApplicationTypes.NativeConfidential)
            {
                if (string.IsNullOrWhiteSpace(query.ClientSecret))
                {
                    Log.Warning("Client secret should be sent.");
                    return new ValidateClientAuthenticationResult(false);
                }
                if (client.Secret != Hasher.ComputeSHA256(query.ClientSecret))
                {
                    Log.Warning("Client secret is invalid.");
                    return new ValidateClientAuthenticationResult(false);
                }
            }

            if (!client.Active)
            {
                Log.Warning("Client is inactive.");
                return new ValidateClientAuthenticationResult(false);
            }

            return new ValidateClientAuthenticationResult(true, client.AllowedOrigin, client.RefreshTokenLifeTime);
        }
    }
}