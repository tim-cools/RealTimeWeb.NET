using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.Owin.Logging;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Store;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;
using Soloco.ReactiveStarterKit.Membership.Services;

namespace Soloco.ReactiveStarterKit.Membership.Client.QueryHandlers
{
    public class ValidateClientAuthenticationHandler : IHandleMessage<ValidateClientAuthenticationQuery, ValidateClientAuthenticationResult>
    {
        private readonly ILogger _logger;
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
                    _logger.WriteWarning("Client '{0}' is not registered in the system.", query.ClientId);
                    return new ValidateClientAuthenticationResult(false);
                }

                if (client.ApplicationType == ApplicationTypes.NativeConfidential)
                {
                    if (string.IsNullOrWhiteSpace(query.ClientSecret))
                    {
                        _logger.WriteWarning("Client secret should be sent.");
                        return new ValidateClientAuthenticationResult(false);
                    }
                    if (client.Secret != Helper.GetHash(query.ClientSecret))
                    {
                        _logger.WriteWarning("Client secret is invalid.");
                        return new ValidateClientAuthenticationResult(false);
                    }
                }

                if (!client.Active)
                {
                    _logger.WriteWarning("Client is inactive.");
                    return new ValidateClientAuthenticationResult(false);
                }

                return new ValidateClientAuthenticationResult(true, client.AllowedOrigin, client.RefreshTokenLifeTime);
            }
        }
    }
}