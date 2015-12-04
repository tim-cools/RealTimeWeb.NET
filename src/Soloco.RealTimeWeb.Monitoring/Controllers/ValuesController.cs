using System.Collections.Generic;
using Microsoft.AspNet.Mvc;

namespace Soloco.RealTimeWeb.Monitoring.Controllers
{
    [Route("api/[controller]")]
    public class ServicesController : Controller
    {
        // GET: api/values
        [HttpGet]
        public IEnumerable<Service> Get()
        {
            return new []
            {
                new Service
                {
                    Name = "Monitoring",
                    Status = "Online"
                },
                new Service
                {
                    Name = "Database",
                    Status = "Online"
                },
            };
        }
    }

    public class Service
    {
        public string Name { get; set; }
        public string Status { get; set; }
    }
}
