using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;
using Soloco.ReactiveStarterKit.Membership.Services;

namespace Soloco.ReactiveStarterKit.Membership.QueryHandlers
{
    public class UserByNameQueryHandler : IHandleMessage<UserByNameQuery, User>
    {
        private readonly IDisposable _scope;
        private readonly UserManager<Domain.User, Guid> _userManager;

        public UserByNameQueryHandler(IDocumentSession session, IDisposable scope)
        {
            _scope = scope;
            var userStore = new UserStore(session);
            _userManager = new UserManager<Domain.User, Guid>(userStore);
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