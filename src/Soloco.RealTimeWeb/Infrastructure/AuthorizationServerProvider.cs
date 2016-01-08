using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Server;
using Microsoft.AspNet.Authentication;
using Microsoft.AspNet.Http.Authentication;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json.Linq;
using Soloco.RealTimeWeb.Membership.Messages.Queries;
using AspNet.Security.OpenIdConnect.Extensions;

namespace Soloco.RealTimeWeb.Infrastructure
{
    public class AuthorizationServerProvider : OpenIdConnectServerProvider
    {
        private readonly IServiceProvider _serviceProvider;

        public AuthorizationServerProvider(IServiceProvider serviceProvider)
        {
            if (serviceProvider == null) throw new ArgumentNullException(nameof(serviceProvider));

            _serviceProvider = serviceProvider;
        }

        /// <summary>
        /// Validates whether the client is a valid known application in our system.
        /// </summary>
        public override async Task ValidateClientAuthentication(ValidateClientAuthenticationContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ValidateClientAuthentication");

            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var query = new ValidateClientAuthenticationQuery(context.ClientId, context.ClientSecret);
            var result = await messageDispatcher.Execute(query);

            if (!result.Valid)
            {
                context.Rejected(
                    error: "invalid_client",
                    description: "Application not found in the database: ensure that your client_id is correct");

                return;
            }

            context.HttpContext.Items.Add("as:clientAllowedOrigin", result.AllowedOrigin);
            context.HttpContext.Items.Add("as:clientRefreshTokenLifeTime", result.RefreshTokenLifeTime.ToString());

            context.Validated();
        }

        /// <summary>
        /// Validates the userName and password provided by the user.
        /// </summary>
        public override async Task GrantResourceOwnerCredentials(GrantResourceOwnerCredentialsContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.GrantResourceOwnerCredentials");

            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var query = new ValidUserLoginQuery(context.UserName, context.Password);
            var valid = await messageDispatcher.Execute(query);

            if (!valid)
            {
                context.Rejected("invalid_grant", "The user name or password is incorrect.");
                return;
            }

            SetCorsHeader(context);

            var ticket = CreateAuthenticationTicket(context);
            context.Validated(ticket);
        }

        /// <summary>
        /// Set cross-origin HTTP request (Cors) header to allow requests from a different domains. 
        /// This Cors value is specific to an Application and set by when validating the client application (ValidateClientAuthenticationp).
        /// </summary>
        private static void SetCorsHeader(GrantResourceOwnerCredentialsContext context)
        {
            var allowedOrigin = context.HttpContext.Items["as:clientAllowedOrigin"] as string;

            if (allowedOrigin != null)
            {
                context.HttpContext.Response.Headers.Add("Access-Control-Allow-Origin", new StringValues(allowedOrigin));
            }
        }

        /// <summary>
        /// Creates a valid authentication token used to validate the 
        /// </summary>
        private static AuthenticationTicket CreateAuthenticationTicket(GrantResourceOwnerCredentialsContext context)
        {
            var identity = new ClaimsIdentity(context.Options.AuthenticationScheme);
            identity.AddClaim(ClaimTypes.Name, context.UserName, "id_token token");
            identity.AddClaim(ClaimTypes.Role, "user");

            var properties = new AuthenticationProperties(new Dictionary<string, string>
                {
                    {"as:client_id", context.ClientId ?? string.Empty},
                    {"userName", context.UserName}
                }
            );

            var principal = new ClaimsPrincipal(new[] { identity });
            var ticket = new AuthenticationTicket(principal, properties, context.Options.AuthenticationScheme);
            ticket.SetResources(new [] { "http://localhost:3000/" });
            return ticket;
        }

        public override Task GrantRefreshToken(GrantRefreshTokenContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.GrantRefreshToken");

            var originalClient = context.AuthenticationTicket.Properties.Items["as:client_id"];
            var currentClient = context.ClientId;

            if (originalClient != currentClient)
            {
                context.Rejected("invalid_clientId", "Refresh token is issued to a different clientId.");
                return Task.FromResult(true);
            }

            // Change auth ticket for refresh token requests
            var principal = context.AuthenticationTicket.Principal;
            var newPrincipal = new ClaimsPrincipal(principal);

            var claimsIdentity = newPrincipal.Identity as ClaimsIdentity;
            if (claimsIdentity == null)
            {
                context.Rejected("invalid_principal", "ClaimPrincipal is invalid.");
                return Task.FromResult(true);
            }

            var newClaim = newPrincipal.Claims.FirstOrDefault(c => c.Type == "newClaim");
            if (newClaim != null)
            {
                claimsIdentity.RemoveClaim(newClaim);
            }
            claimsIdentity.AddClaim(new Claim("newClaim", "newValue"));

            var newTicket = new AuthenticationTicket(newPrincipal, context.AuthenticationTicket.Properties, context.Options.AuthenticationScheme);

            context.Validated(newTicket);

            return Task.FromResult(true);
        }

        public override Task TokenEndpointResponse(TokenEndpointResponseContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.TokenEndpointResponse");

            foreach (var property in context.HttpContext.Items)
            {
                context.Payload.Add(property.Key as string, new JValue(property.Value));
            }
            return Task.FromResult(true);
        }

        public override Task MatchEndpoint(MatchEndpointContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.MatchEndpoint");
           
            // Note: by default, OpenIdConnectServerHandler only handles authorization requests made to the authorization endpoint.
            // This context handler uses a more relaxed policy that allows extracting authorization requests received at
            // /connect/authorize/accept and /connect/authorize/deny (see AuthorizationController.cs for more information).
            if (context.Options.AuthorizationEndpointPath.HasValue &&
                context.Request.Path.StartsWithSegments(context.Options.AuthorizationEndpointPath))
            {
                context.MatchesAuthorizationEndpoint();
            }

            return Task.FromResult<object>(null);
        }

        public override Task ProfileEndpoint(ProfileEndpointContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ValidateClientLogoutRedirectUri");
            
            // Note: by default, OpenIdConnectServerHandler automatically handles userinfo requests and directly
            // writes the JSON response to the response stream. This sample uses a custom ProfileController that
            // handles userinfo requests: context.SkipToNextMiddleware() is called to bypass the default
            // request processing executed by OpenIdConnectServerHandler.
            context.SkipToNextMiddleware();

            return Task.FromResult<object>(null);
        }

        public override Task ValidateTokenRequest(ValidateTokenRequestContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ValidateTokenRequest");
            return Task.FromResult<object>(null);
        }

        public override async Task ValidateClientRedirectUri(ValidateClientRedirectUriContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ValidateClientLogoutRedirectUri");
            context.Validated(context.RedirectUri);
            return; //todo do the real check


            var messageDispatcher = _serviceProvider.GetMessageDispatcher();

            var query = new ValidateClientAuthenticationQuery(context.ClientId, context.ClientSecret);
            var result = await messageDispatcher.Execute(query);

            if (!result.Valid)
            {
                context.Rejected(
                    error: "invalid_client",
                    description: "Application not found in the database: ensure that your client_id is correct");

                return;
            }

            if (!string.IsNullOrEmpty(context.RedirectUri) && !string.IsNullOrEmpty(result.RedirectUri))
            {
                if (!string.Equals(context.RedirectUri, result.RedirectUri, StringComparison.Ordinal))
                {
                    context.Rejected(error: "invalid_client", description: "Invalid redirect_uri");

                    return;
                }
            }

            context.Validated(context.RedirectUri);
        }

        public override Task ValidateClientLogoutRedirectUri(ValidateClientLogoutRedirectUriContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ValidateClientLogoutRedirectUri");
            return base.ValidateClientLogoutRedirectUri(context);
        }

        public override Task ValidateAuthorizationRequest(ValidateAuthorizationRequestContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ValidateAuthorizationRequest");
            return base.ValidateAuthorizationRequest(context);
        }

        public override Task GrantAuthorizationCode(GrantAuthorizationCodeContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.GrantAuthorizationCode");
            return base.GrantAuthorizationCode(context);
        }

        public override Task GrantClientCredentials(GrantClientCredentialsContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.GrantClientCredentials");
            return base.GrantClientCredentials(context);
        }

        public override Task GrantCustomExtension(GrantCustomExtensionContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.GrantCustomExtension");
            return base.GrantCustomExtension(context);
        }

        public override Task AuthorizationEndpoint(AuthorizationEndpointContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.AuthorizationEndpoint");
            return base.AuthorizationEndpoint(context);
        }

        public override Task AuthorizationEndpointResponse(AuthorizationEndpointResponseContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.AuthorizationEndpointResponse");
            return base.AuthorizationEndpointResponse(context);
        }

        public override Task LogoutEndpoint(LogoutEndpointContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.LogoutEndpoint");
            return base.LogoutEndpoint(context);
        }

        public override Task LogoutEndpointResponse(LogoutEndpointResponseContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.LogoutEndpointResponse");
            return base.LogoutEndpointResponse(context);
        }

        public override Task ProfileEndpointResponse(ProfileEndpointResponseContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ProfileEndpointResponse");
            return base.ProfileEndpointResponse(context);
        }

        public override Task ConfigurationEndpoint(ConfigurationEndpointContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ConfigurationEndpoint");
            return base.ConfigurationEndpoint(context);
        }

        public override Task ConfigurationEndpointResponse(ConfigurationEndpointResponseContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ConfigurationEndpointResponse");
            return base.ConfigurationEndpointResponse(context);
        }

        public override Task CryptographyEndpoint(CryptographyEndpointContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.CryptographyEndpoint");
            return base.CryptographyEndpoint(context);
        }

        public override Task CryptographyEndpointResponse(CryptographyEndpointResponseContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.CryptographyEndpointResponse");
            return base.CryptographyEndpointResponse(context);
        }

        public override Task TokenEndpoint(TokenEndpointContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.TokenEndpoint");
            return base.TokenEndpoint(context);
        }

        public override Task ValidationEndpoint(ValidationEndpointContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ValidationEndpoint");
            return base.ValidationEndpoint(context);
        }

        public override Task ValidationEndpointResponse(ValidationEndpointResponseContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.ValidationEndpointResponse");
            return base.ValidationEndpointResponse(context);
        }

        public override Task SerializeAuthorizationCode(SerializeAuthorizationCodeContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.SerializeAuthorizationCode");
            return base.SerializeAuthorizationCode(context);
        }

        public override Task SerializeAccessToken(SerializeAccessTokenContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.SerializeAccessToken");
            return base.SerializeAccessToken(context);
        }

        public override Task SerializeIdentityToken(SerializeIdentityTokenContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.SerializeIdentityToken");
            return base.SerializeIdentityToken(context);
        }

        public override Task SerializeRefreshToken(SerializeRefreshTokenContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.SerializeRefreshToken");
            return base.SerializeRefreshToken(context);
        }

        public override Task DeserializeAuthorizationCode(DeserializeAuthorizationCodeContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.DeserializeAuthorizationCode");
            return base.DeserializeAuthorizationCode(context);
        }

        public override Task DeserializeAccessToken(DeserializeAccessTokenContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.DeserializeAccessToken");
            return base.DeserializeAccessToken(context);
        }

        public override Task DeserializeIdentityToken(DeserializeIdentityTokenContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.DeserializeIdentityToken");
            return base.DeserializeIdentityToken(context);
        }

        public override Task DeserializeRefreshToken(DeserializeRefreshTokenContext context)
        {
            Debug.WriteLine("AuthorizationServerProvider.DeserializeRefreshToken");
            return base.DeserializeRefreshToken(context);
        }


        //public override async Task ValidateClientLogoutRedirectUri(ValidateClientLogoutRedirectUriContext context)
        //{
        //    var database = context.HttpContext.RequestServices.GetRequiredService<ApplicationContext>();

        //    // Note: ValidateClientLogoutRedirectUri is not invoked when post_logout_redirect_uri is null.
        //    // When provided, post_logout_redirect_uri must exactly match the address registered by the client application.
        //    if (!await database.Applications.AnyAsync(application => application.LogoutRedirectUri == context.PostLogoutRedirectUri))
        //    {
        //        context.Reject(error: "invalid_client", description: "Invalid post_logout_redirect_uri");

        //        return;
        //    }

        //    context.Validate();
        //}
        //public async Task CreateAsync(AuthenticationTokenCreateContext context)
        //{
        //    var clientid = context.Ticket.Properties.Dictionary["as:client_id"];

        //    if (string.IsNullOrEmpty(clientid))
        //    {
        //        return;
        //    }

        //    var refreshTokenLifeTime = context.OwinContext.Get<string>("as:clientRefreshTokenLifeTime");

        //    var issuedUtc = DateTime.UtcNow;
        //    var expiresUtc = issuedUtc.AddMinutes(Convert.ToDouble(refreshTokenLifeTime));

        //    context.Ticket.Properties.IssuedUtc = issuedUtc;
        //    context.Ticket.Properties.ExpiresUtc = expiresUtc;

        //    var protectedTicket = context.SerializeTicket();

        //    var messageDispatcher = _dependencyResolver.GetMessageDispatcher();

        //    var refreshTokenId = Guid.NewGuid().ToString("n");
        //    var command = new CreateRefreshTokenCommand(
        //        refreshTokenId,
        //        protectedTicket,
        //        clientid,
        //        context.Ticket.Identity.Name,
        //        issuedUtc,
        //        expiresUtc
        //        );

        //    var result = await messageDispatcher.Execute(command);

        //    if (result.Succeeded)
        //    {
        //        context.SetToken(refreshTokenId);
        //    }
        //}

        //public async Task ReceiveAsync(AuthenticationTokenReceiveContext context)
        //{
        //    var allowedOrigin = context.OwinContext.Get<string>("as:clientAllowedOrigin");
        //    context.OwinContext.Response.Headers.Add("Access-Control-Allow-Origin", new[] { allowedOrigin });

        //    throw new NotImplementedException();

        //    string hashedTokenId = Helper.GetHash(context.Token);

        //    //using (AuthRepository _repo = new AuthRepository())
        //    //{
        //    //    var refreshToken = await _repo.FindRefreshToken(hashedTokenId);

        //    //    if (refreshToken != null )
        //    //    {
        //    //        //Get protectedTicket from refreshToken class
        //    //        context.DeserializeTicket(refreshToken.ProtectedTicket);
        //    //        var result = await _repo.RemoveRefreshToken(refreshToken);
        //    //    }
        //    //}
        //}
    }
}