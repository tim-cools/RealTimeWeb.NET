using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Extensions;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Http.Authentication;
using Microsoft.AspNetCore.Mvc;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Infrastructure;
using Microsoft.AspNetCore.Builder;
using System.Linq;
using Soloco.RealTimeWeb.Membership.Messages.Clients;
using Soloco.RealTimeWeb.Membership.Messages.Users;
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

        [HttpGet("~/account/authorize/connect")]
        public ActionResult Connect(string provider)
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
        public async Task<ActionResult> Complete(CancellationToken cancellationToken)
        {
            var request = HttpContext.GetOpenIdConnectRequest();
            if (request == null)
            {
                return InvalidRequest("An internal error has occurred (No OpenIdConnectRequest)");
            }

            if (User.Claims.ToArray().Length == 0)
            {
                return InvalidRequest("An internal error has occurred (No Claims)");
            }

            var query = new ClientValidator(request.ClientId, request.ClientSecret);
            var applicationResult = await _messageDispatcher.Execute(query);
            if (!applicationResult.Succeeded)
            {
                return InvalidRequest("invalid_client", "Client application not validated"); 
            }

            var type = User.Identity.AuthenticationType;
            var userName = User.FindFirstValue(ClaimTypes.Name);
            var externalIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = User.FindFirstValue(ClaimTypes.Email);

            var command = new ExternalLoginCommand(type, userName, externalIdentifier, email);
            var result = await _messageDispatcher.Execute(command);
            if (!result.Succeeded)
            {
                return InvalidRequest("Could not login external");
            }

            var principal = CreateClaimsPrincipal(result, applicationResult);
            var properties = CreateAuthenticationProperties();

            await HttpContext.Authentication.SignInAsync(OpenIdConnectServerDefaults.AuthenticationScheme, principal, properties);

            return new EmptyResult();
        }

        private static AuthenticationProperties CreateAuthenticationProperties()
        {
            var properties = new AuthenticationProperties();
            properties.SetScopes(new[]
            {
                OpenIdConnectConstants.Scopes.OpenId,
                OpenIdConnectConstants.Scopes.Email,
                OpenIdConnectConstants.Scopes.Profile,
                OpenIdConnectConstants.Scopes.OfflineAccess
            });
            properties.SetResources(new[] { "http://localhost:3000/" });
            return properties;
        }

        private ClaimsPrincipal CreateClaimsPrincipal(LoginResult result, ValidateClientResult client)
        {
            var identity = new ClaimsIdentity(OpenIdConnectServerDefaults.AuthenticationScheme);
            identity.AddClaim(ClaimTypes.Name, result.UserName, destination: "id_token token");
            identity.AddClaim(ClaimTypes.NameIdentifier, result.UserId.ToString(), destination: "id_token token");

            identity.Actor = new ClaimsIdentity(OpenIdConnectServerDefaults.AuthenticationScheme);
            identity.Actor.AddClaim(ClaimTypes.NameIdentifier, client.Id.ToString());
            identity.Actor.AddClaim(ClaimTypes.Name, client.Name);

            return new ClaimsPrincipal(identity);
        }

        [HttpGet("~/account/authorized")]
        public ActionResult Authorized()
        {
            //Authorization token is pushed to main window in JS (see view)
            return View();
        }

        [HttpPost("~/account/signout")]
        public async Task SignOut()
        {
            await DeleteLocalAuthenticationCookie();
        }

        private async Task DeleteLocalAuthenticationCookie()
        {
            await HttpContext.Authentication.SignOutAsync("ServerCookie");
        }

        private BadRequestObjectResult InvalidRequest(string message)
        {
            return HttpBadRequest(new
            {
                Error = "invalid_request",
                ErrorDescription = message
            });
        }

        private BadRequestObjectResult InvalidRequest(string error, string message)
        {
            return HttpBadRequest(new
            {
                Error = error,
                ErrorDescription = message
            });
        }
    }
}