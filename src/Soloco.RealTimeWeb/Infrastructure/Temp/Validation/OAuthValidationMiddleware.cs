using Microsoft.AspNet.Authentication;
using Microsoft.AspNet.Builder;
using Microsoft.AspNet.DataProtection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.WebEncoders;

namespace AspNet.Security.OAuth.Validation
{
    public class OAuthValidationMiddleware : AuthenticationMiddleware<OAuthValidationOptions>
    {
        public OAuthValidationMiddleware(
            RequestDelegate next,
            OAuthValidationOptions options,
            ILoggerFactory loggerFactory,
            IDataProtectionProvider dataProtectionProvider)
            : base(next, options, loggerFactory, new UrlEncoder())
        {
            if (options.TicketFormat == null)
            {
                // Note: the purposes of the default ticket
                // format must match the values used by ASOS.
                options.TicketFormat = new TicketDataFormat(
                    dataProtectionProvider.CreateProtector(
                        "AspNet.Security.OpenIdConnect.Server.OpenIdConnectServerMiddleware",
                        options.AuthenticationScheme, "Access_Token", "v1"));
            }
        }

        protected override AuthenticationHandler<OAuthValidationOptions> CreateHandler()
        {
            return new OAuthValidationHandler();
        }
    }
}