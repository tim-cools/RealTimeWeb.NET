using System;
using System.Threading.Tasks;
using Marten;
using Serilog;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Store;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Client.QueryHandlers
{
    public class ValidateClientAuthenticationHandler : IHandleMessage<ValidateClientAuthenticationQuery, ValidateClientAuthenticationResult>
    {
        private readonly IDisposable _scope;
        private readonly IDocumentSession _session;

        public ValidateClientAuthenticationHandler(IDocumentSession session, IDisposable scope)
        {
            _scope = scope;
            _session = session;
        }

        public async Task<ValidateClientAuthenticationResult> Handle(ValidateClientAuthenticationQuery query)
        {
            using (_scope)
            {
                var client = _session.GetFirst<Domain.Client>(criteria => criteria.Key == query.ClientId);
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
                    if (client.Secret != Helper.GetHash(query.ClientSecret))
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
}