using System.Web.Http;

namespace Soloco.ReactiveStarterKit.Controllers
{
    [RoutePrefix("api/Orders")]
    public class OrdersController : ApiController
    {
        //[Authorize]
        [Route("")]
        public IHttpActionResult Get()
        {
            //ClaimsPrincipal principal = Request.GetRequestContext().Principal as ClaimsPrincipal;

            //var Name = ClaimsPrincipal.Current.Identity.Name;
            //var Name1 = User.Identity.Name;

            //var userName = principal.Claims.Where(c => c.Type == "sub").Single().Value;

            return Ok(Order.CreateOrders());
        }

    }


    #region Helpers

    #endregion
}
