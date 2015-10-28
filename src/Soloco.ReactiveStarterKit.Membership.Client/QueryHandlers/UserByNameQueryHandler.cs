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
    public class UserByNameQueryHandler : IHandleMessage<UserByNameQuery, User>
    {
        private readonly IDisposable _scope;
        private readonly UserManager<IdentityUser, Guid> _userManager;

        public UserByNameQueryHandler(ISessionScope sessionScope, IDisposable scope)
        {
            _scope = scope;
            var userStore = new UserStore(sessionScope.Session);
            _userManager = new UserManager<IdentityUser, Guid>(userStore);
        }

        public async Task<User> Handle(UserByNameQuery query)
        {
            using (_scope)
            {
                var result = await _userManager.FindByNameAsync(query.UserName);
                return result != null ? new User { } : null;
            }
        }
    }
}