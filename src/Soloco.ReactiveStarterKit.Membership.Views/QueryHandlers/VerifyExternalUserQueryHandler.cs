using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Store;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;
using Soloco.ReactiveStarterKit.Membership.Services;

namespace Soloco.ReactiveStarterKit.Membership.Client.QueryHandlers
{
    public class VerifyExternalUserQueryHandler : IHandleMessage<VerifyExternalUserQuery, VerifyExternalUserResult>
    {
        private readonly IDisposable _scope;
        private readonly UserManager<IdentityUser, Guid> _userManager;
        private readonly IProviderTokenValidatorFactory _providerTokenValidatorFactory;

        public VerifyExternalUserQueryHandler(IDocumentSession session, IDisposable scope, IProviderTokenValidatorFactory providerTokenValidatorFactory)
        {
            _scope = scope;
            _providerTokenValidatorFactory = providerTokenValidatorFactory;

            var userStore = new UserStore(session);
            _userManager = new UserManager<IdentityUser, Guid>(userStore);
        }

        public async Task<VerifyExternalUserResult> Handle(VerifyExternalUserQuery query)
        {
            using (_scope)
            {
                var validator = _providerTokenValidatorFactory.Create(query.Provider);
                var verifiedAccessToken = await validator.ValidateToken(query.ExternalAccessToken);
                if (verifiedAccessToken == null)
                {
                    return new VerifyExternalUserResult(false);
                }

                var login = new UserLoginInfo(query.Provider.ToString(), verifiedAccessToken.UserId);
                var user = await _userManager.FindAsync(login);

                return user == null
                    ? new VerifyExternalUserResult(false)
                    : new VerifyExternalUserResult(true, user.UserName);
            }
        }
    }
}