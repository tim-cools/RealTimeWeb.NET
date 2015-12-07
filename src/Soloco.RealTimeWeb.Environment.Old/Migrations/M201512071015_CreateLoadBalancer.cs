using System;
using Soloco.RealTimeWeb.Environment.Core;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201512071015_CreateLoadBalancer : IMigration
    {
        private readonly MigrationContext _context;

        public M201512071015_CreateLoadBalancer(MigrationContext context)
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
