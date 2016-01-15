using System;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Infrastructure.Configuration;
using Soloco.RealTimeWeb.ViewModels.Installation;

namespace Soloco.RealTimeWeb.Controllers
{
    public class InstallationController : Controller
    {
        private readonly IConfiguration _configuration;
        private readonly IMessageDispatcher _messageDispatcher;

        public InstallationController(IConfiguration configuration, IMessageDispatcher messageDispatcher)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));
            if (messageDispatcher == null) throw new ArgumentNullException(nameof(messageDispatcher));

            _configuration = configuration;
            _messageDispatcher = messageDispatcher;
        }

        public ActionResult Index()
        {
            if (_configuration.GeneralConfigured())
            {
                return RedirectToAction("Index", "Home");
            }

            return View(new InstallationResponse(false));

        }

        [HttpPost]
        public async Task<ActionResult> Index(ConfigurationRequest request)
        {
            if (_configuration.GeneralConfigured())
            {
                return RedirectToAction("Index", "Home");
            }

            var command = new StoreConfigurationCommand(
                request.FacebookAppId,
                request.FacebookAppSecret,
                request.GoogleClientId,
                request.GoogleClientSecret);

            var result = await _messageDispatcher.Execute(command);
            if (!result.Succeeded)
            {
                return HttpBadRequest();
            }

            return View(new InstallationResponse(true));
        }
    }
}