using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Services;

namespace Soloco.ReactiveStarterKit.Membership.CommandHandlers
{
    public class RegisterUserHandler : CommandHandler<RegisterUserCommand>
    {
        private readonly UserManager<IdentityUser, Guid> _userManager;

        public RegisterUserHandler(IDocumentSession session, IDisposable scope) : base(session, scope)
        {
            var userStore = new UserStore(session);
            _userManager = new UserManager<IdentityUser, Guid>(userStore);            
        }

        protected override async Task<CommandResult> Execute(RegisterUserCommand command)
        {
            var user = new IdentityUser(command.UserName);
            var result = await _userManager.CreateAsync(user, command.Password);
            return result.ToCommandResult();
        }
    }
}