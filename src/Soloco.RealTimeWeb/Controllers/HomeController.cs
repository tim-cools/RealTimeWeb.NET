using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common;

namespace Soloco.RealTimeWeb.Controllers
{
    public class HomeController : Controller
    {
        private readonly IConfiguration _configuration;

        public HomeController(IConfiguration configuration)
        {
            if (configuration == null) throw new ArgumentNullException(nameof(configuration));

            _configuration = configuration;
        }


        public ActionResult Index()
        {
            if (!_configuration.GeneralConfigured())
            {
                return RedirectToAction("Index", "Installation");
            }

            return View();
        }

        public ActionResult Error()
        {
            return View();
        }
    }
}