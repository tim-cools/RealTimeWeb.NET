using System;
using System.Threading.Tasks;
using Marten;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.Queries;
using Soloco.ReactiveStarterKit.Membership.Services;

namespace Soloco.ReactiveStarterKit.Membership.CommandHandlers
{
    public class RegisterExternalUserHandler : CommandHandler<RegisterExternalUserCommand>
    {
        private readonly UserManager<IdentityUser, Guid> _userManager;
        private readonly IProviderTokenValidatorFactory _providerTokenValidatorFactory;

        public RegisterExternalUserHandler(IDocumentSession session, IDisposable scope, IProviderTokenValidatorFactory providerTokenValidatorFactory) : base(session, scope)
        {
            _providerTokenValidatorFactory = providerTokenValidatorFactory;

            var userStore = new UserStore(session);
            _userManager = new UserManager<IdentityUser, Guid>(userStore);
        }

        protected override async Task<CommandResult> Execute(RegisterExternalUserCommand command)
        {
            var validator = _providerTokenValidatorFactory.Create(command.Provider);
            var verifiedAccessToken = await validator.ValidateToken(command.ExternalAccessToken);

            await VerifyNotRegistered(command, verifiedAccessToken);

            var user = await CreateUser(command);

            return await CreateLogin(command, user, verifiedAccessToken.UserId);
        }

        private async Task VerifyNotRegistered(RegisterExternalUserCommand command, ParsedExternalAccessToken verifiedAccessToken)
        {
            var query = new UserLoginQuery(command.Provider, verifiedAccessToken.UserId);
            var loginInfo = new UserLoginInfo(query.LoginProvider.ToString(), query.ProviderKey);
            var userLogin = await _userManager.FindAsync(loginInfo);

            if (userLogin != null)
            {
                throw new BusinessException("External user is already registered");
            }
        }

        private async Task<IdentityUser> CreateUser(RegisterExternalUserCommand command)
        {
            var user = new IdentityUser(command.UserName);
            var result = await _userManager.CreateAsync(user);

            result.ThrowWhenFailed("Could not create user");

            return user;
        }

        private async Task<CommandResult> CreateLogin(RegisterExternalUserCommand command, IdentityUser user, string verifiedAccessTokenuser_id)
        {
            var info = new ExternalLoginInfo
            {
                DefaultUserName = command.UserName,
                Login = new UserLoginInfo(command.Provider.ToString(), verifiedAccessTokenuser_id)
            };

            var result = await _userManager.AddLoginAsync(user.Id, info.Login);
            return result.ToCommandResult();
        }
    }
}