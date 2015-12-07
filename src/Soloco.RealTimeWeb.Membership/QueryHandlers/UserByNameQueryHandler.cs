using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.QueryHandlers
{
    public class UserByNameQueryHandler : QueryHandler<UserByNameQuery, User>
    {
        private readonly UserManager<Domain.User> _userManager;

        public UserByNameQueryHandler(UserManager<Domain.User> userManager, IDocumentSession session, IDisposable scope)
              : base(session, scope)
        {
            _userManager = userManager;
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