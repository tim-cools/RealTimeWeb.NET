using System;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Commands;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;

namespace Soloco.ReactiveStarterKit.Membership.Users.CommandHandlers
{
    public class RegisterUserHandler : IHandleMessage<RegisterUserCommand, IdentityResult>
    {
        private readonly ISessionScope _sessionScope;
        private readonly IDisposable _scope;
        private readonly UserManager<IdentityUser, Guid> _userManager;

        public RegisterUserHandler(ISessionScope sessionScope, IDisposable scope)
        {
            _sessionScope = sessionScope;
            _scope = scope;
            var userStore = new UserStore(sessionScope.Session);
            _userManager = new UserManager<IdentityUser, Guid>(userStore);
        }

        public async Task<IdentityResult> Handle(RegisterUserCommand command)
        {
            using (_scope)
            {
                var user = new IdentityUser(command.UserName);
                var result = _userManager.Create(user, command.Password);

                if (result.Succeeded)
                {
                    _sessionScope.Session.SaveChanges();
                }

                return await Task.FromResult(result);
            }
        }
    }
}