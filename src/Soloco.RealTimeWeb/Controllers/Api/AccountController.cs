using System;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web.Http;
using Microsoft.AspNet.Identity;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.OAuth;
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
    [RoutePrefix("api/Account")]
    public class AccountController : ApiController
    {
        private readonly IMessageDispatcher _messageDispatcher;
        private readonly IOAuthConfiguration _ioAuthConfiguration;

        private IAuthenticationManager Authentication => Request.GetOwinContext().Authentication;

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
        public async Task<IHttpActionResult> Register(UserModel userModel)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var command = new RegisterUserCommand(userModel.UserName, userModel.Password);
            var result = await _messageDispatcher.Execute(command);

            return GetErrorResult(result) ?? Ok();
        }

        // GET api/Account/ExternalLogin
        [OverrideAuthentication]
        [HostAuthentication(DefaultAuthenticationTypes.ExternalCookie)]
        [AllowAnonymous]
        [Route("ExternalLogin", Name = "ExternalLogin")]
        public async Task<IHttpActionResult> GetExternalLogin(string provider, string error = null)
        {
            if (error != null)
            {
                return BadRequest(Uri.EscapeDataString(error));
            }

            if (!User.Identity.IsAuthenticated)
            {
                return new ChallengeResult(provider, this);
            }

            var result = await ValidateClientAndRedirectUri(Request);

            if (!string.IsNullOrWhiteSpace(result.Error))
            {
                return BadRequest(result.Error);
            }

            var externalLogin = ExternalLoginData.FromIdentity(User.Identity as ClaimsIdentity);
            if (externalLogin == null)
            {
                return InternalServerError();
            }

            if (externalLogin.LoginProvider != provider.AsLoginProvider())
            {
                Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);
                return new ChallengeResult(provider, this);
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
        [Route("RegisterExternal")]
        public async Task<IHttpActionResult> RegisterExternal(RegisterExternalBindingModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var command = new RegisterExternalUserCommand(model.UserName, model.Provider.AsLoginProvider(), model.ExternalAccessToken);
            var result = await _messageDispatcher.Execute(command);
            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            var accessTokenResponse = GenerateLocalAccessTokenResponse(model.UserName);

            return Ok(accessTokenResponse);
        }

        [AllowAnonymous]
        [HttpGet]
        [Route("ObtainLocalAccessToken")]
        public async Task<IHttpActionResult> ObtainLocalAccessToken(string provider, string externalAccessToken)
        {
            if (string.IsNullOrWhiteSpace(provider) || string.IsNullOrWhiteSpace(externalAccessToken))
            {
                return BadRequest("Provider or external access token is not sent");
            }

            var command = new VerifyExternalUserQuery(provider.AsLoginProvider(), externalAccessToken);
            var result = await _messageDispatcher.Execute(command);
            if (!result.Registered)
            {
                return BadRequest("External user is not registered");
            }

            var accessTokenResponse = GenerateLocalAccessTokenResponse(result.UserName);
            return Ok(accessTokenResponse);
        }

        private IHttpActionResult GetErrorResult(CommandResult result)
        {
            var errors = ModelState
                    .SelectMany(value => value.Value.Errors)
                    .Select(error => error.ErrorMessage)
                    .ToArray();

            var merged = result == null 
                ? new CommandResult(errors) 
                : result.Merge(CommandResult.Failed(errors));

            return merged.Succeeded ? null : new CommandResultActionResult(merged, this);
        }

        private async Task<ValidatClientResult> ValidateClientAndRedirectUri(HttpRequestMessage request)
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

        private static string GetQueryString(HttpRequestMessage request, string key)
        {
            var queryStrings = request.GetQueryNameValuePairs();

            if (queryStrings == null) return null;

            var match = queryStrings
                .FirstOrDefault(keyValue => string.Compare(keyValue.Key, key, StringComparison.OrdinalIgnoreCase) == 0);

            return string.IsNullOrEmpty(match.Value) ? null : match.Value;
        }

        private JObject GenerateLocalAccessTokenResponse(string userName)
        {
            var tokenExpiration = TimeSpan.FromDays(1);

            var identity = new ClaimsIdentity(OAuthDefaults.AuthenticationType);

            identity.AddClaim(new Claim(ClaimTypes.Name, userName));
            identity.AddClaim(new Claim("role", "user"));

            var props = new AuthenticationProperties
            {
                IssuedUtc = DateTime.UtcNow,
                ExpiresUtc = DateTime.UtcNow.Add(tokenExpiration),
            };

            var ticket = new AuthenticationTicket(identity, props);

            var accessToken = _ioAuthConfiguration.Bearer.AccessTokenFormat.Protect(ticket);

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
