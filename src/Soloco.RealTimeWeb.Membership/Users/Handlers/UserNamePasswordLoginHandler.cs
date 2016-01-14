using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Users;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using User = Soloco.RealTimeWeb.Membership.Users.Domain.User;

namespace Soloco.RealTimeWeb.Membership.Users.Handlers
{
    public class UserNamePasswordLoginHandler : QueryHandler<UserNamePasswordLogin, LoginResult>
    {
        private readonly UserManager<User> _userManager;

        public UserNamePasswordLoginHandler(UserManager<User> userManager, IDocumentSession session)
              : base(session)
        {
            _userManager = userManager;
        }

        protected override async Task<LoginResult> Execute(UserNamePasswordLogin query)
        {
            var user = await _userManager.FindByNameAsync(query.UserName);
            if (user == null)
            {
                return new LoginResult(false);
            }

            var valid = await _userManager.CheckPasswordAsync(user, query.Password);

            return valid 
                ? new LoginResult(true, user.Id, user.UserName) 
                : new LoginResult(false);
        }
    }
}