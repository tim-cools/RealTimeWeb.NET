using Microsoft.AspNet.Mvc;

namespace Soloco.RealTimeWeb.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}