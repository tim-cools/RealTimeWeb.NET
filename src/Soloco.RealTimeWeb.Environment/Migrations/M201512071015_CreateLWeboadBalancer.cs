using System;
using Soloco.RealTimeWeb.Environment.Core;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201512071015_CreateWebLoadBalancer : IMigration
    {
        private readonly MigrationContext _context;

        public M201512071015_CreateWebLoadBalancer(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
        }

        public void Up()
        {

        }

        public void Down()
        {

        }
    }
    public class M201512121015_CreateMonitoringLoadBalancer : IMigration
    {
        private readonly MigrationContext _context;

        public M201512121015_CreateMonitoringLoadBalancer(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
        }

        public void Up()
        {

        }

        public void Down()
        {

        }
    }
}
