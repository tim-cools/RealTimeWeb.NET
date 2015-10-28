using System;
using System.Threading.Tasks;
using System.Web.Http;

namespace Soloco.ReactiveStarterKit.Controllers
{
    [RoutePrefix("api/RefreshTokens")]
    public class RefreshTokensController : ApiController
    {
        [Authorize(Users="Admin")]
        [Route("")]
        public IHttpActionResult Get()
        {
            throw new NotImplementedException();
            //return Ok(_repo.GetAllRefreshTokens());
        }

        //[Authorize(Users = "Admin")]
        [AllowAnonymous]
        [Route("")]
        public async Task<IHttpActionResult> Delete(Guid tokenId)
        {
            throw new NotImplementedException();
            //var result = await _repo.RemoveRefreshToken(tokenId);
            //if (result)
            //{
            //    return Ok();
            //}
            //return BadRequest("Token Id does not exist");
            
        }
    }
}
