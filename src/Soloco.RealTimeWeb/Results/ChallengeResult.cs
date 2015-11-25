using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace Soloco.RealTimeWeb.Results
{
    public class ChallengeResult : IHttpActionResult
    {
        public string LoginProvider { get; }
        public HttpRequestMessage Request { get; }

        public ChallengeResult(string loginProvider, ApiController controller)
        {
            LoginProvider = loginProvider;
            Request = controller.Request;
        }

        public Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
        {
            Request.GetOwinContext().Authentication.Challenge(LoginProvider);

            var response = new HttpResponseMessage(HttpStatusCode.Unauthorized) { RequestMessage = Request };
            return Task.FromResult(response);
        }
    }
}