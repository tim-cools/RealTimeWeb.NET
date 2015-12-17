using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Commands
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
