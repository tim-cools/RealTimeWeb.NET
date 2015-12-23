using System;
using System.Threading.Tasks;
using Microsoft.AspNet.Authorization;
using Microsoft.AspNet.Mvc;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Infrastructure.Documentation;

namespace Soloco.RealTimeWeb.Controllers.Api
{
    
    [Route("api/documents")]
    public class DocumentsController : Controller
    {
        private readonly IMessageDispatcher _messageDispatcher;

        public DocumentsController(IMessageDispatcher messageDispatcher)
        {
            if (messageDispatcher == null) throw new ArgumentNullException(nameof(messageDispatcher));

            _messageDispatcher = messageDispatcher;
        }

        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            var query = new DocumentsQuery();
            var documents = await _messageDispatcher.Execute(query);
            return Json(documents);
        }

        [AllowAnonymous]
        [Route("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var query = new DocumentQuery(id);
            var document = await _messageDispatcher.Execute(query);
            return document != null ? (IActionResult) Json(document) : HttpNotFound();
        }
    }
}
