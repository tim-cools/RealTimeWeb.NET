using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Queries
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