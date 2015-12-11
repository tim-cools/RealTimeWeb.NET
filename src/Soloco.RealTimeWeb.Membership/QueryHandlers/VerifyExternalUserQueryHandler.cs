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
        private readonly UserManager<User> _userManager;
        private readonly IProviderTokenValidatorFactory _providerTokenValidatorFactory;

        public VerifyExternalUserQueryHandler(UserManager<User> userManager ,IDocumentSession session, IProviderTokenValidatorFactory providerTokenValidatorFactory)
            : base(session)
        {
            _providerTokenValidatorFactory = providerTokenValidatorFactory;

            _userManager = userManager;
        }

        protected override async Task<VerifyExternalUserResult> Execute(VerifyExternalUserQuery query)
        {
            var validator = _providerTokenValidatorFactory.Create(query.Provider);
            var verifiedAccessToken = await validator.ValidateToken(query.ExternalAccessToken);
            if (verifiedAccessToken == null)
            {
                return new VerifyExternalUserResult(false);
            }

            var user = await _userManager.FindByLoginAsync(query.Provider.ToString(), verifiedAccessToken.UserId);

            return user == null
                ? new VerifyExternalUserResult(false)
                : new VerifyExternalUserResult(true, user.UserName);
        }
    }
}