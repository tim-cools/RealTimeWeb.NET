using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Commands
{
    public class RegisterExternalUserCommand : IMessage<CommandResult>
    {
        public string UserName { get; }
        public LoginProvider Provider { get; }
        public string ExternalAccessToken { get; }

        public RegisterExternalUserCommand(string userName, LoginProvider provider, string externalAccessToken)
        {
            UserName = userName;
            Provider = provider;
            ExternalAccessToken = externalAccessToken;
        }
    }
}
