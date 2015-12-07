using System;
using System.Threading.Tasks;
using System.Web.Http;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Commands;
using Soloco.RealTimeWeb.Membership.Messages.Queries;

namespace Soloco.RealTimeWeb.Controllers
{
    [RoutePrefix("api/RefreshTokens")]
    public class RefreshTokensController : ApiController
    {
        private readonly IMessageDispatcher _messageDispatcher;

        public RefreshTokensController(IMessageDispatcher messageDispatcher)
        {
            if (messageDispatcher == null) throw new ArgumentNullException(nameof(messageDispatcher));

            _messageDispatcher = messageDispatcher;
        }

        [Authorize(Users="Admin")]
        [Route("")]
        public async Task<IHttpActionResult> Get()
        {
            var query = new RefreshTokensQuery();
            var tokens = await _messageDispatcher.Execute(query);

            return Ok(tokens);
        }

        [Authorize(Users = "Admin")]
        [Route("")]
        public async Task<IHttpActionResult> Delete(Guid tokenId)
        {
            var command = new DeleteRefreshTokenCommand(tokenId);
            var result = await _messageDispatcher.Execute(command);

            return result.Succeeded ? (IHttpActionResult) Ok() : BadRequest("Token Id does not exist");
        }
    }
}
