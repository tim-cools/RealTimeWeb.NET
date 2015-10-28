using System;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;
using Soloco.ReactiveStarterKit.Membership.Client.Model;
using Soloco.ReactiveStarterKit.Membership.Client.Queries;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Users;
using Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers;

namespace Soloco.ReactiveStarterKit.Membership.Client.QueryHandlers
{
    public class UserLoginQueryHandler : IHandleMessage<UserLoginQuery, UserLogin>
    {
        private readonly IDisposable _scope;
        private readonly UserManager<IdentityUser, Guid> _userManager;

        public UserLoginQueryHandler(ISessionScope sessionScope, IDisposable scope)
        {
            _scope = scope;
            var userStore = new UserStore(sessionScope.Session);
            _userManager = new UserManager<IdentityUser, Guid>(userStore);
        }

        public async Task<UserLogin> Handle(UserLoginQuery query)
        {
            using (_scope)
            {
                var loginInfo = new UserLoginInfo(query.LoginProvider, query.ProviderKey);
                var result = await _userManager.FindAsync(loginInfo);
                return result != null ? new UserLogin { } : null;
            }
        }
    }
}