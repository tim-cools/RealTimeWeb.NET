using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Membership.Messages.Users;
using Soloco.RealTimeWeb.ViewModels;

namespace Soloco.RealTimeWeb.Controllers.Api
{
    public class AccountController : Controller
    {
        private readonly IMessageDispatcher _messageDispatcher;

        public AccountController(IMessageDispatcher messageDispatcher)
        {
            if (messageDispatcher == null) throw new ArgumentNullException(nameof(messageDispatcher));

            _messageDispatcher = messageDispatcher;
        }

        [Authorize]
        [HttpGet("~/api/account/")]
        public async Task<IActionResult> Get(UserModel userModel)
        {
            var identifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(identifier))
            {
                return BadRequest();
            }

            var query = new UserByIdQuery(Guid.Parse(identifier));
            var user = await _messageDispatcher.Execute(query);

            return Json(user);
        }

        [AllowAnonymous]
        [Route("~/api/account/register")]
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

        private IActionResult ErrorResult(Result result = null)
        {
            var errors = ModelState
                    .SelectMany(value => value.Value.Errors)
                    .Select(error => error.ErrorMessage)
                    .ToArray();

            var modelValidationResult = errors.Length == 0 ? Result.Success : Result.Failed(errors);

            var merged = result == null
                ? modelValidationResult
                : result.Merge(modelValidationResult);

            return merged.Succeeded ? (IActionResult)Ok() : new ObjectResult(merged) { StatusCode = StatusCodes.Status400BadRequest };
        }
    }
}
