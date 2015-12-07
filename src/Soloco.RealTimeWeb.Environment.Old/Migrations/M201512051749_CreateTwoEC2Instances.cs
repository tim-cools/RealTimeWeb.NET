using System;
using Soloco.RealTimeWeb.Environment.Core;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201512051749_CreateTwoEC2Instances : IMigration
    {
        private readonly MigrationContext _context;

        public M201512051749_CreateTwoEC2Instances(MigrationContext context)
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
