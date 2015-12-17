using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using UserLogin = Soloco.RealTimeWeb.Membership.Messages.ViewModel.UserLogin;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class UserLoginQueryHandler : QueryHandler<UserLoginQuery, UserLogin>
    {
        private readonly UserManager<User> _userManager;

        public UserLoginQueryHandler(UserManager<User> userManager, IDocumentSession session)
              : base(session)
        {
            _userManager = userManager;
        }

        protected override async Task<UserLogin> Execute(UserLoginQuery query)
        {
            var result = await _userManager.FindByLoginAsync(query.LoginProvider.ToString(), query.ProviderKey);
            return result != null ? new UserLogin { } : null;
        }
    }
}