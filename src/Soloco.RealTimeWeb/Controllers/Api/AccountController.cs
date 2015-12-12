using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNet.Authentication;
using Microsoft.AspNet.Authorization;
using Microsoft.AspNet.Http;
using Microsoft.AspNet.Http.Authentication;
using Microsoft.AspNet.Mvc;
using Newtonsoft.Json.Linq;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;
using Soloco.RealTimeWeb.Membership.Services;
using Soloco.RealTimeWeb.Models;
using Soloco.RealTimeWeb.Results;

namespace Soloco.RealTimeWeb.Controllers.Api
{
    [Route("api/Account")]
    public class AccountController : Controller
    {
        private readonly IMessageDispatcher _messageDispatcher;
        private readonly IOAuthConfiguration _ioAuthConfiguration;

        public AccountController(IMessageDispatcher messageDispatcher, IOAuthConfiguration ioAuthConfiguration)
        {
            if (messageDispatcher == null) throw new ArgumentNullException(nameof(messageDispatcher));
            if (ioAuthConfiguration == null) throw new ArgumentNullException(nameof(ioAuthConfiguration));

            _messageDispatcher = messageDispatcher;
            _ioAuthConfiguration = ioAuthConfiguration;
        }

        // POST api/Account/Register
        [AllowAnonymous]
        [Route("Register")]
        public async Task<IActionResult> Register(UserModel userModel)
        {
            if (!ModelState.IsValid)
            {
                return ErrorResult();
            }

            var command = new RegisterUserCommand(userModel.UserName, userModel.EMail, userModel.Password);
            var result = await _messageDispatcher.Execute(command);

            return ErrorResult(result);
        }

        // GET api/Account/ExternalLogin
        //[OverrideAuthentication]
        //[HostAuthentication(DefaultAuthenticationTypes.ExternalCookie)]
        [AllowAnonymous]
        [HttpGet("ExternalLogin")]
        public async Task<IActionResult> GetExternalLogin(string provider, string error = null)
        {
            if (error != null)
            {
                return ErrorResult(Uri.EscapeDataString(error));
            }

            if (!User.Identity.IsAuthenticated)
            {
                return new ChallengeResult(new List<string>  { provider });
                //was return new ChallengeResult(provider, this);
            }

            var result = await ValidateClientAndRedirectUri(Request);

            if (!string.IsNullOrWhiteSpace(result.Error))
            {
                return ErrorResult(result.Error);
            }

            var externalLogin = ExternalLoginData.FromIdentity(User.Identity as ClaimsIdentity);
            if (externalLogin == null)
            {
                return ErrorResult();
            }

            if (externalLogin.LoginProvider != provider.AsLoginProvider())
            {
                //await Authentication.SignOutAsync(DefaultAuthenticationTypes.ExternalCookie);
                //await Authentication.SignOutAsync("Todo"); //Todo sign out
                return new ChallengeResult(new List<string> { provider });
            }

            var query = new UserLoginQuery(externalLogin.LoginProvider, externalLogin.ProviderKey);
            var userLogin = await _messageDispatcher.Execute(query);

            var hasRegistered = userLogin != null;

            var redirectUri = $"{result.RedirectUri}#external_access_token={externalLogin.ExternalAccessToken}" +
                          $"&provider={externalLogin.LoginProvider}" +
                          $"&haslocalaccount={hasRegistered}" +
                          $"&external_user_name={externalLogin.UserName}";

            return Redirect(redirectUri);
        }

        // POST api/Account/RegisterExternal
        [AllowAnonymous]
        [System.Web.Http.Route("RegisterExternal")]
        public async Task<IActionResult> RegisterExternal(RegisterExternalBindingModel model)
        {
            if (!ModelState.IsValid)
            {
                return ErrorResult();
            }

            var command = new RegisterExternalUserCommand(model.UserName, model.Provider.AsLoginProvider(), model.ExternalAccessToken);
            var result = await _messageDispatcher.Execute(command);
            if (!result.Succeeded)
            {
                return ErrorResult(result);
            }

            var accessTokenResponse = GenerateLocalAccessTokenResponse(model.UserName);

            return Ok(accessTokenResponse);
        }

        [AllowAnonymous]
        [System.Web.Http.HttpGet]
        [System.Web.Http.Route("ObtainLocalAccessToken")]
        public async Task<IActionResult> ObtainLocalAccessToken(string provider, string externalAccessToken)
        {
            if (string.IsNullOrWhiteSpace(provider) || string.IsNullOrWhiteSpace(externalAccessToken))
            {
                return ErrorResult("Provider or external access token is not sent");
            }

            var command = new VerifyExternalUserQuery(provider.AsLoginProvider(), externalAccessToken);
            var result = await _messageDispatcher.Execute(command);
            if (!result.Registered)
            {
                return ErrorResult("External user is not registered");
            }

            var accessTokenResponse = GenerateLocalAccessTokenResponse(result.UserName);
            return Ok(accessTokenResponse);
        }

        private IActionResult ErrorResult(CommandResult result = null)
        {
            var errors = ModelState
                    .SelectMany(value => value.Value.Errors)
                    .Select(error => error.ErrorMessage)
                    .ToArray();

            var modelValidationResult = errors.Length == 0 ? CommandResult.Success : CommandResult.Failed(errors);

            var merged = result == null 
                ? modelValidationResult
                : result.Merge(modelValidationResult);

            return merged.Succeeded ? (IActionResult) Ok() : new ObjectResult(merged) { StatusCode = StatusCodes.Status400BadRequest };
        }

        private IActionResult ErrorResult(string error)
        {
            var result = CommandResult.Failed(error);
            return ErrorResult(result);
        }

        private async Task<ValidatClientResult> ValidateClientAndRedirectUri(HttpRequest request)
        {
            Uri redirectUri;

            var redirectUriString = GetQueryString(request, "redirect_uri");
            if (string.IsNullOrWhiteSpace(redirectUriString))
            {
                return new ValidatClientResult("redirect_uri is required");
            }

            var validUri = Uri.TryCreate(redirectUriString, UriKind.Absolute, out redirectUri);
            if (!validUri)
            {
                return new ValidatClientResult("redirect_uri is invalid");
            }

            var clientId = GetQueryString(request, "client_id");
            if (string.IsNullOrWhiteSpace(clientId))
            {
                return new ValidatClientResult("client_Id is required");
            }

            var query = new ClientByKeyQuery(clientId);
            var client = await _messageDispatcher.Execute(query);

            if (client == null)
            {
                return new ValidatClientResult($"Client_id '{clientId}' is not registered in the system.");
            }

            if (!string.Equals(client.AllowedOrigin, redirectUri.GetLeftPart(UriPartial.Authority), StringComparison.OrdinalIgnoreCase))
            {
                return new ValidatClientResult($"The given URL is not allowed by Client_id '{clientId}' configuration.");
            }

            return new ValidatClientResult(null, redirectUri.AbsoluteUri);
        }

        private static string GetQueryString(HttpRequest request, string key)
        {
            var queryStrings = request.Query;

            if (queryStrings == null) return null;

            return queryStrings.ContainsKey(key) ? queryStrings[key].FirstOrDefault() : null;
        }

        private JObject GenerateLocalAccessTokenResponse(string userName)
        {
            var tokenExpiration = TimeSpan.FromDays(1);

            var identity = new ClaimsIdentity();

            identity.AddClaim(new Claim(ClaimTypes.Name, userName));
            identity.AddClaim(new Claim("role", "user"));

            var props = new AuthenticationProperties()
            {
                IssuedUtc = DateTime.UtcNow,
                ExpiresUtc = DateTime.UtcNow.Add(tokenExpiration),
            };

            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, props, "Schema"); //todo get schema from config

            //var accessToken = _ioAuthConfiguration.Bearer.AccessTokenFormat.Protect(ticket);
            //todo get access_token schema from somewhere
            var accessToken = "this";

            var tokenResponse = new JObject(
                new JProperty("userName", userName),
                new JProperty("access_token", accessToken),
                new JProperty("token_type", "bearer"),
                new JProperty("expires_in", tokenExpiration.TotalSeconds.ToString()),
                new JProperty(".issued", ticket.Properties.IssuedUtc.ToString()),
                new JProperty(".expires", ticket.Properties.ExpiresUtc.ToString())
            );

            return tokenResponse;
        }
    }
}
