using System;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Services
{
    public class GoogleProviderTokenValidator : ProviderTokenValidator
    {
        private readonly IOAuthConfiguration _ioAuthConfiguration;

        public override LoginProvider Provider => LoginProvider.Google;

        public GoogleProviderTokenValidator(IOAuthConfiguration ioAuthConfiguration)
        {
            if (ioAuthConfiguration == null) throw new ArgumentNullException(nameof(ioAuthConfiguration));

            _ioAuthConfiguration = ioAuthConfiguration;
        }

        protected override ParsedExternalAccessToken ParseToken(dynamic jObject)
        {
            var parsedToken = new ParsedExternalAccessToken
            {
                UserId = jObject["user_id"],
                ApplicationId = jObject["audience"],
                Email = jObject["email"]
            };

            if (!string.Equals(_ioAuthConfiguration.Google.ClientId, parsedToken.ApplicationId, StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessException("Invalid googleAuthOptions ClientId");
            }
            return parsedToken;
        }

        protected override string GetEndpoint(string accessToken)
        {
            return $"https://www.googleapis.com/oauth2/v1/tokeninfo" +
                   $"?access_token={accessToken}";
        }
    }
}