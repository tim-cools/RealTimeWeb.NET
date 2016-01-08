using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Extensions;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Http.Authentication;
using Microsoft.AspNet.Mvc;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Infrastructure;
using Microsoft.AspNet.Builder;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using System.Linq;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Controllers
{
    public class AccountController : Controller
    {
        private readonly IMessageDispatcher _messageDispatcher;

        public AccountController(IMessageDispatcher messageDispatcher)
        {
            _messageDispatcher = messageDispatcher;
        }

        [HttpGet("~/account/authorize")]
        public ActionResult Authorize(string provider)
        {
            if (string.IsNullOrEmpty(provider) || !HttpContext.IsProviderSupported(provider))
            {
                return InvalidRequest($"An internal error has occurred (provider not supported '{provider}')");
            }
        

            var response = HttpContext.GetOpenIdConnectResponse();
            if (response != null)
            {
                return HttpBadRequest(response);
            }

            var request = HttpContext.GetOpenIdConnectRequest();
            if (request == null)
            {
                return InvalidRequest("An internal error has occurred");
            }

            var redirectUri = "/account/authorize/complete?unique_id=" + request.GetUniqueIdentifier();
            if (User.Identities.Any(identity => identity.IsAuthenticated))
            {
                return Redirect(redirectUri);
            }

            return RedirectToProviderAuthtication(provider, redirectUri);
        }

        private static ChallengeResult RedirectToProviderAuthtication(string provider, string redirectUri)
        {
            var properties = new AuthenticationProperties { RedirectUri = redirectUri };
            return new ChallengeResult(provider, properties);
        }

        [HttpGet("~/account/authorize/complete")]
        public async Task<ActionResult> Authorize(CancellationToken cancellationToken)
        {
            var request = HttpContext.GetOpenIdConnectRequest();
            if (request == null)
            {
                return InvalidRequest("An internal error has occurred (No OpenIdConnectRequest)");
            }

            var claims = HttpContext.User.Claims.ToArray();
            if (claims.Length == 0)
            {
                return InvalidRequest("An internal error has occurred (No Claims)");
            }

            var application = await _messageDispatcher.Execute(new ClientByKeyQuery(request.ClientId));
            if (application == null)
            {
                //todo get real application here
                application = new Client { Name = "App" };
                //return HttpBadRequest(new
                //{
                //    Error = "invalid_client",
                //    ErrorDescription = "Details concerning the calling client application cannot be found in the database"
                //});
            }

            var identity = CreateClaimsIdentity(claims, application);
            var properties = CreateAuthenticationProperties();

            await HttpContext.Authentication.SignInAsync(
                OpenIdConnectServerDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity), properties);

            return new EmptyResult();
        }

        private static AuthenticationProperties CreateAuthenticationProperties()
        {
            var properties = new AuthenticationProperties();
            properties.SetScopes(new[]
            {
                OpenIdConnectConstants.Scopes.OpenId,
                OpenIdConnectConstants.Scopes.Email,
                OpenIdConnectConstants.Scopes.Profile
            });
            return properties;
        }

        private static ClaimsIdentity CreateClaimsIdentity(Claim[] claims, Client application)
        {
            var identity = new ClaimsIdentity(OpenIdConnectServerDefaults.AuthenticationScheme);
            foreach (var claim in claims)
            {
                if (claim.Type == ClaimTypes.Name)
                {
                    claim.WithDestination("id_token")
                        .WithDestination("token");
                }

                identity.AddClaim(claim);
            }

            identity.Actor = new ClaimsIdentity(OpenIdConnectServerDefaults.AuthenticationScheme);
            identity.Actor.AddClaim(ClaimTypes.NameIdentifier, application.Id.ToString());
            identity.Actor.AddClaim(ClaimTypes.Name, application.Name, destination: "id_token token");


            return identity;
        }

        [HttpGet("~/account/authorized")]
        public async Task<ActionResult> Authorize(CancellationToken cancellationToken)
        {
        }

        [HttpGet("~/account/signout")]
        [HttpPost("~/account/signout")]
        public async Task SignOut()
        {
            await DeleteLocalAuthenticationCookie();
        }

        private BadRequestObjectResult InvalidRequest(string message)
        {
            return HttpBadRequest(new
            {
                Error = "invalid_request",
                ErrorDescription = message
            });
        }

        private async Task DeleteLocalAuthenticationCookie()
        {
            await HttpContext.Authentication.SignOutAsync("ServerCookie");
        }
    }
}