using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using Soloco.RealTimeWeb.Membership.Services;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class UserByNameQueryHandler : QueryHandler<UserByNameQuery, User>
    {
        private readonly UserManager<Domain.User, Guid> _userManager;

        public UserByNameQueryHandler(IDocumentSession session, IDisposable scope)
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