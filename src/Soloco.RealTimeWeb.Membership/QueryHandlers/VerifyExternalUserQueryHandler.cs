using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using Soloco.RealTimeWeb.Membership.Services;
using User = Soloco.RealTimeWeb.Membership.Domain.User;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class VerifyExternalUserQueryHandler : QueryHandler<VerifyExternalUserQuery, VerifyExternalUserResult>
    {
        private readonly UserManager<User, Guid> _userManager;
        private readonly IProviderTokenValidatorFactory _providerTokenValidatorFactory;

        public VerifyExternalUserQueryHandler(IDocumentSession session, IDisposable scope, IProviderTokenValidatorFactory providerTokenValidatorFactory)
            : base(session, scope)
        {
            _providerTokenValidatorFactory = providerTokenValidatorFactory;

            var userStore = new UserStore(session);
            _userManager = new UserManager<User, Guid>(userStore);
        }

        protected override async Task<VerifyExternalUserResult> Execute(VerifyExternalUserQuery query)
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