//using System.Net;
//using System.Net.Http;
//using System.Threading;
//using System.Threading.Tasks;
//using Microsoft.AspNet.Mvc;
//using Soloco.RealTimeWeb.Common.Infrastructure;

//namespace Soloco.RealTimeWeb.Results
//{
//    internal class CommandResultActionResult : IActionResult
//    {
//        private readonly CommandResult _result;

//        public CommandResultActionResult(CommandResult result)
//        {
//            _result = result;
//        }

//        //private CommandResultActionResult(CommandResult result, IDependencyProvider dependencies)
//        //{
//        //    _result = result;
//        //    //_dependencies = dependencies;
//        //}

//        public Task ExecuteResultAsync(ActionContext context)
//        {
//            return Task.FromResult(Execute());
//        }

//        private HttpResponseMessage Execute()
//        {
//            var httpResponseMessage = new HttpResponseMessage();
//            httpResponseMessage.StatusCode = HttpStatusCode.NotAcceptable;
//            return new ObjectResult(_result);

//            //var negotiationResult = _dependencies.ContentNegotiator.Negotiate(typeof(CommandResult), _dependencies.Request, _dependencies.Formatters);
//            //var httpResponseMessage = new HttpResponseMessage();
//            //try
//            //{
//            //    if (negotiationResult == null)
//            //    {
//            //        httpResponseMessage.StatusCode = HttpStatusCode.NotAcceptable;
//            //    }
//            //    else
//            //    {
//            //        httpResponseMessage.StatusCode = HttpStatusCode.BadRequest;
//            //        httpResponseMessage.Content = new ObjectContent<CommandResult>(_result, negotiationResult.Formatter, negotiationResult.MediaType);
//            //    }
//            //    httpResponseMessage.RequestMessage = _dependencies.Request;
//            //}
//            //catch
//            //{
//            //    httpResponseMessage.Dispose();
//            //    throw;
//            //}
//            //return httpResponseMessage;
//        }
//    }
//}