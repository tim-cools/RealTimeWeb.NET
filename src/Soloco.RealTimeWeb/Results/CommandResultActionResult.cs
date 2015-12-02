using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using Soloco.RealTimeWeb.Common.Infrastructure;

namespace Soloco.RealTimeWeb.Results
{
    internal class CommandResultActionResult : IHttpActionResult
    {
        private readonly CommandResult _result;
        private readonly IDependencyProvider _dependencies;

        public CommandResultActionResult(CommandResult  result, ApiController controller)
          : this(result, new ApiControllerDependencyProvider(controller))
        {
        }

        private CommandResultActionResult(CommandResult result, IDependencyProvider dependencies)
        {
            _result = result;
            _dependencies = dependencies;
        }

        public virtual Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult(Execute());
        }

        private HttpResponseMessage Execute()
        {
            var negotiationResult = _dependencies.ContentNegotiator.Negotiate(typeof(CommandResult), _dependencies.Request, _dependencies.Formatters);
            var httpResponseMessage = new HttpResponseMessage();
            try
            {
                if (negotiationResult == null)
                {
                    httpResponseMessage.StatusCode = HttpStatusCode.NotAcceptable;
                }
                else
                {
                    httpResponseMessage.StatusCode = HttpStatusCode.BadRequest;
                    httpResponseMessage.Content = new ObjectContent<CommandResult>(_result, negotiationResult.Formatter, negotiationResult.MediaType);
                }
                httpResponseMessage.RequestMessage = _dependencies.Request;
            }
            catch
            {
                httpResponseMessage.Dispose();
                throw;
            }
            return httpResponseMessage;
        }

    }
}