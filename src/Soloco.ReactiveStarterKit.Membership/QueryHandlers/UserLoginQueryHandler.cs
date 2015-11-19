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
    public class UserLoginQueryHandler : IHandleMessage<UserLoginQuery, UserLogin>
    {
        private readonly IDisposable _scope;
        private readonly UserManager<User, Guid> _userManager;

        public UserLoginQueryHandler(IDocumentSession session, IDisposable scope)
        {
            _scope = scope;
            var userStore = new UserStore(session);
            _userManager = new UserManager<User, Guid>(userStore);
        }

        public async Task<UserLogin> Handle(UserLoginQuery query)
        {
            using (_scope)
            {
                var loginInfo = new UserLoginInfo(query.LoginProvider.ToString(), query.ProviderKey);
                var result = await _userManager.FindAsync(loginInfo);
                return result != null ? new UserLogin { } : null;
            }
        }
    }
}