using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Services;

namespace Soloco.RealTimeWeb.Membership.CommandHandlers
{
    public class RegisterUserHandler : CommandHandler<RegisterUserCommand>
    {
        private readonly UserManager<User, Guid> _userManager;

        public RegisterUserHandler(IDocumentSession session, IDisposable scope) : base(session, scope)
        {
            var userStore = new UserStore(session);
            _userManager = new UserManager<User, Guid>(userStore);            
        }

        protected override async Task<CommandResult> Execute(RegisterUserCommand command)
        {
            var user = new User(command.UserName);
            var result = await _userManager.CreateAsync(user, command.Password);
            return result.ToCommandResult();
        }
    }
}