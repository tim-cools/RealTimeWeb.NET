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

        public async Task<ActionResult> Index()
        {
            if (_configuration.GeneralConfigured())
            {
                return RedirectToAction("Index", "Home");
            }

            var query = new GetConfigurationQuery();

            var result = await _messageDispatcher.Execute(query);
            if (!result.Succeeded)
            {
                return HttpBadRequest();
            }

            var response = MapResponse(result);
            return View(response);
        }

        private static InstallationResponse MapResponse(ConfigurationResult result)
        {
            var response = new InstallationResponse(false)
            {
                ConnectionString = result.ConnectionString,
                ConnectionStringAdmin = result.ConnectionStringAdmin,
                RabbitMqHostName = result.RabbitMqHostName,
                RabbitMqUserName = result.RabbitMqUserName,
                RabbitMqPassword = result.RabbitMqPassword,
                GoogleClientId = result.AuthenticationGoogleClientId,
                GoogleClientSecret = result.AuthenticationGoogleClientSecret,
                FacebookAppId = result.AuthenticationFacebookAppId,
                FacebookAppSecret = result.AuthenticationFacebookAppSecret
            };
            return response;
        }

        [HttpPost]
        public async Task<ActionResult> Index(ConfigurationRequest request)
        {
            if (_configuration.GeneralConfigured())
            {
                return RedirectToAction("Index", "Home");
            }

            var command = MapCommand(request);

            var result = await _messageDispatcher.Execute(command);
            if (!result.Succeeded)
            {
                return HttpBadRequest();
            }

            return View(new InstallationResponse(true));
        }

        private static StoreConfigurationCommand MapCommand(ConfigurationRequest request)
        {
            return new StoreConfigurationCommand(
                request.ConnectionString,
                request.ConnectionStringAdmin,
                request.RabbitMqHostName,
                request.RabbitMqUserName,
                request.RabbitMqPassword,
                request.FacebookAppId,
                request.FacebookAppSecret,
                request.GoogleClientId,
                request.GoogleClientSecret
                );
        }
    }
}