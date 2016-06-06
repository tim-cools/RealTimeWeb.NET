using System.Threading.Tasks;
using Marten;
using Microsoft.AspNetCore.Identity;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Users;

namespace Soloco.RealTimeWeb.Membership.Users.Handlers
{
    public class UserByIdHandler : QueryHandler<UserByIdQuery, User>
    {
        private readonly UserManager<Domain.User> _userManager;

        public UserByIdHandler(UserManager<Domain.User> userManager, IDocumentSession session)
              : base(session)
        {
            _userManager = userManager;
        }

        protected override async Task<User> Execute(UserByIdQuery query)
        {
            var result = Session.Load<Domain.User>(query.Id);
            return result != null ? Map(result) : null;
        }

        private User Map(Domain.User result)
        {
            return new User
            {
                Id = result.Id,
                UserName = result.UserName,
                Name = result.FullName,
                EMail = result.Email
            };
        }
    }
}