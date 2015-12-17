using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Messages.Queries
{
    public class VerifyExternalUserQuery : IMessage<VerifyExternalUserResult>
    {
        public LoginProvider Provider { get; }
        public string ExternalAccessToken { get; }

        public VerifyExternalUserQuery(LoginProvider provider, string externalAccessToken)
        {
            Provider = provider;
            ExternalAccessToken = externalAccessToken;         
        }
    }
}