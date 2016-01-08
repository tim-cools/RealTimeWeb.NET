using System;
using System.Linq;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Extensions;
using Microsoft.AspNet.Authentication;
using Microsoft.Net.Http.Headers;

namespace AspNet.Security.OAuth.Validation
{
    public class OAuthValidationHandler : AuthenticationHandler<OAuthValidationOptions>
    {
        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            string header = Request.Headers[HeaderNames.Authorization];
            if (string.IsNullOrEmpty(header))
            {
                return AuthenticateResult.Failed("Authentication failed because the bearer token " +
                                                 "was missing from the 'Authorization' header.");
            }

            // Ensure that the authorization header contains the mandatory "Bearer" scheme.
            // See https://tools.ietf.org/html/rfc6750#section-2.1
            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return AuthenticateResult.Failed("Authentication failed because an invalid scheme " +
                                                 "was used in the 'Authorization' header.");
            }

            var token = header.Substring("Bearer ".Length);
            if (string.IsNullOrWhiteSpace(token))
            {
                return AuthenticateResult.Failed("Authentication failed because the bearer token " +
                                                 "was missing from the 'Authorization' header.");
            }

            // Try to unprotect the token and return an error
            // if the ticket can't be decrypted or validated.
            var ticket = Options.TicketFormat.Unprotect(token);
            if (ticket == null)
            {
                return AuthenticateResult.Failed("Authentication failed because the access token was invalid.");
            }

            // Ensure that the access token was issued
            // to be used with this resource server.
            if (!await ValidateAudienceAsync(ticket))
            {
                return AuthenticateResult.Failed("Authentication failed because the access token " +
                                                 "was not valid for this resource server.");
            }

            // Ensure that the authentication ticket is still valid.
            if (ticket.Properties.ExpiresUtc.HasValue &&
                ticket.Properties.ExpiresUtc.Value < Options.SystemClock.UtcNow)
            {
                return AuthenticateResult.Failed("Authentication failed because the access token was expired.");
            }

            return AuthenticateResult.Success(ticket);
        }

        protected virtual Task<bool> ValidateAudienceAsync(AuthenticationTicket ticket)
        {
            // If no explicit audience has been configured,
            // skip the default audience validation.
            if (string.IsNullOrEmpty(Options.Audience))
            {
                return Task.FromResult(true);
            }

            // Ensure that the registered audience can be found in the
            // "audiences" property stored in the authentication ticket.
            var audiences = ticket.GetAudiences();
            if (audiences.Contains(Options.Audience, StringComparer.Ordinal))
            {
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
    }
}