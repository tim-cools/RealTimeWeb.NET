using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Services;
using UserLogin = Soloco.ReactiveStarterKit.Membership.Messages.ViewModel.UserLogin;

namespace Soloco.ReactiveStarterKit.Membership.QueryHandlers
{
    public class UserLoginQueryHandler : QueryHandler<UserLoginQuery, UserLogin>
    {
        private readonly UserManager<User, Guid> _userManager;

        public UserLoginQueryHandler(ISession session, IDisposable scope)
              : base(session, scope)
        {
            var userStore = new UserStore(session);
            _userManager = new UserManager<User, Guid>(userStore);
        }

        protected override async Task<UserLogin> Execute(UserLoginQuery query)
        {
            var loginInfo = new UserLoginInfo(query.LoginProvider.ToString(), query.ProviderKey);
            var result = await _userManager.FindAsync(loginInfo);
            return result != null ? new UserLogin { } : null;
        }
    }
}