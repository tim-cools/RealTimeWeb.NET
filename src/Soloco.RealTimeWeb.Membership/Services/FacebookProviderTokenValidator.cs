using System;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public class FacebookProviderTokenValidator : ProviderTokenValidator
    {
        private readonly IOAuthConfiguration _ioAuthConfiguration;

        public override LoginProvider Provider => LoginProvider.Facebook;

        public FacebookProviderTokenValidator(IOAuthConfiguration ioAuthConfiguration)
        {
            _ioAuthConfiguration = ioAuthConfiguration;
        }

        protected override ParsedExternalAccessToken ParseToken(dynamic jObject)
        {
            var parsedToken = new ParsedExternalAccessToken();
            var data = jObject["data"];
            parsedToken.UserId = data["user_id"];
            parsedToken.ApplicationId = data["app_id"];

            if (!string.Equals(_ioAuthConfiguration.Facebook.AppId, parsedToken.ApplicationId, StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessException("Invalid facebookAuthOptions ClientId");
            }

            return parsedToken;
        }

        protected override string GetEndpoint(string accessToken)
        {
            //You can get it from here: https://developers.facebook.com/tools/accesstoken/
            //More about debug_tokn here: http://stackoverflow.com/questions/16641083/how-does-one-get-the-app-access-token-for-debug-token-inspection-on-facebook
            return "https://graph.facebook.com/debug_token" +
                   $"?input_token={accessToken}" +
                   $"&access_token={_ioAuthConfiguration.Facebook.AppId}|{_ioAuthConfiguration.Facebook.AppSecret}";
        }
    }
}