using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.RefreshTokens;

namespace Soloco.RealTimeWeb.Controllers
{
    [Route("api/RefreshTokens")]
    public class RefreshTokensController : Controller
    {
        private readonly IMessageDispatcher _messageDispatcher;

        public RefreshTokensController(IMessageDispatcher messageDispatcher)
        {
            if (messageDispatcher == null) throw new ArgumentNullException(nameof(messageDispatcher));

            _messageDispatcher = messageDispatcher;
        }

        [Authorize(Roles = "Admin")]
        [Route("")]
        public async Task<IActionResult> Get()
        {
            var query = new RefreshTokensQuery();
            var tokens = await _messageDispatcher.Execute(query);

            return Ok(tokens);
        }

        [Authorize(Roles = "Admin")]
        [Route("")]
        public async Task<IActionResult> Delete(Guid tokenId)
        {
            var command = new DeleteRefreshTokenCommand(tokenId);
            var result = await _messageDispatcher.Execute(command);

            return result.Succeeded ? (IActionResult) Ok() : HttpBadRequest("Token Id does not exist");
        }
    }
}
