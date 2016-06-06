using System.Threading.Tasks;
using Marten;
using Microsoft.AspNetCore.Identity;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Users;
using User = Soloco.RealTimeWeb.Membership.Users.Domain.User;

namespace Soloco.RealTimeWeb.Membership.Users.Handlers
{
    public class RegisterUserHandler : CommandHandler<RegisterUserCommand>
    {
        private readonly UserManager<User> _userManager;

        public RegisterUserHandler(UserManager<User> userManager, IDocumentSession session) : base(session)
        {
            _userManager = userManager;
        }

        protected override async Task<Result> Execute(RegisterUserCommand command)
        {
            var user = new User(command.UserName, command.UserName, command.EMail);
            var result = await _userManager.CreateAsync(user, command.Password);
            return result.ToCommandResult();
        }
    }
}