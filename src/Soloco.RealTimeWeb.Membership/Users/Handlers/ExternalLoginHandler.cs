using System;
using System.Linq;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNetCore.Identity;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Users;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using User = Soloco.RealTimeWeb.Membership.Users.Domain.User;

namespace Soloco.RealTimeWeb.Membership.Users.Handlers
{
    public class ExternalLoginHandler : CommandHandler<ExternalLoginCommand, LoginResult>
    {
        private readonly UserManager<User> _userManager;

        public ExternalLoginHandler(UserManager<User> userManager, IDocumentSession session) : base(session)
        {
            _userManager = userManager;
        }

        protected override async Task<LoginResult> Execute(ExternalLoginCommand command)
        {
            var user = await GetOrRegisterUser(command);

            return user == null
                ? new LoginResult(false)
                : new LoginResult(true, user.Id, user.UserName);
        }

        private async Task<User> GetOrRegisterUser(ExternalLoginCommand command)
        {
            var user = await GetByExternalId(command.ExternalType, command.ExternalIdentifier);
            if (user != null)
            {
                return user;
            }

            return GetByEmail(command.EMail) ?? await Register(command);
        }

        private async Task<User> GetByExternalId(string externalType, string externalIdentifier)
        {
            return await _userManager.FindByLoginAsync(externalType, externalIdentifier);
        }

        private User GetByEmail(string email)
        {
            var normalizedEmail = _userManager.NormalizeKey(email);

            return Session.Query<User>()
                .FirstOrDefault(criteria => criteria.NormalizedEmail == normalizedEmail);
        }

        private async Task<User> Register(ExternalLoginCommand command)
        {
            var randomUserName = Guid.NewGuid().ToString();
            var user = new User(randomUserName, command.UserName, command.EMail);

            var result = await _userManager.CreateAsync(user);
            if (!result.Succeeded)
            {
                var message = "Could not register external user";
                throw new BusinessException(message, message);
            }

            await _userManager.AddLoginAsync(user, new UserLoginInfo(command.ExternalIdentifier, command.ExternalType, command.UserName));
            if (!result.Succeeded)
            {
                var message = "Could not register external user login";
                throw new BusinessException(message, message);
            }

            return user;
        }
    }
}