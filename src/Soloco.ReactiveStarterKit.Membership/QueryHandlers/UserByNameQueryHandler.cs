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
    public class UserByNameQueryHandler : QueryHandler<UserByNameQuery, User>
    {
        private readonly UserManager<Domain.User, Guid> _userManager;

        public UserByNameQueryHandler(ISession session, IDisposable scope)
              : base(session, scope)
        {
            var userStore = new UserStore(session);
            _userManager = new UserManager<Domain.User, Guid>(userStore);
        }

        protected override async Task<User> Execute(UserByNameQuery query)
        {
            var result = await _userManager.FindByNameAsync(query.UserName);
            return result != null ? Map(result) : null;
        }

        private User Map(Domain.User result)
        {
            return new User
            {
                Id = result.Id,
                UserName = result.UserName
            };
        }
    }
}