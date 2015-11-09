using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Commands
{
    public class RegisterExternalUserCommand : IMessage<CommandResult>
    {
        public string UserName { get; }
        public string Provider { get; }
        public string ExternalAccessToken { get; }

        public RegisterExternalUserCommand(string userName, string provider, string externalAccessToken)
        {
            UserName = userName;
            Provider = provider;
            ExternalAccessToken = externalAccessToken;
        }
    }
}
