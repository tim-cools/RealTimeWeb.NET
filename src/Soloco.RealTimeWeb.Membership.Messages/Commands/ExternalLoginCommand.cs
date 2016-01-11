using System.Security.Claims;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Commands
{
    public class ExternalLoginCommand : IMessage<LoginResult>
    {
        public string ExternalType { get; }
        public string UserName { get; }
        public string ExternalIdentifier { get; }
        public string EMail { get; }

        public ExternalLoginCommand(string externalType, string userName, string externalIdentifier, string eMail)
        {
            ExternalType = externalType;
            UserName = userName;
            ExternalIdentifier = externalIdentifier;
            EMail = eMail;
        }
    }
}