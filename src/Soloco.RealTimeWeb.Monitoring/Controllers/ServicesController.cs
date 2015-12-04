using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNet.Mvc;

namespace Soloco.RealTimeWeb.Monitoring.Controllers
{
    [Route("api/[controller]")]
    public class ServicesController : Controller
    {
        private readonly IList<IMonitor> _monitors;

        public ServicesController(IMonitor databaseMonitor) //todo inject list of monitors (need other container)
        {
            if (databaseMonitor == null) throw new ArgumentNullException(nameof(databaseMonitor));

            _monitors = new [] { databaseMonitor };
        }

        // GET: api/values
        [HttpGet]
        public IEnumerable<ServiceStatus> Get()
        {
            return _monitors.Select(monitor => monitor.GetStatus()).ToArray();
        }
    }
}