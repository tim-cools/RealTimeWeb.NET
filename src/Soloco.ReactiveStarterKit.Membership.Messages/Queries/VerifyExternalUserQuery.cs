using Soloco.ReactiveStarterKit.Common.Infrastructure.Messages;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Messages.Queries
{
    public class VerifyExternalUserQuery : IMessage<VerifyExternalUserResult>
    {
        public string Provider { get; }
        public string ExternalAccessToken { get; set; }

        public VerifyExternalUserQuery(string provider, string externalAccessToken)
        {
            Provider = provider;
            ExternalAccessToken = externalAccessToken;         
        }
    }
}