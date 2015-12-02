using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal class Runner
    {
        private Logger _logger;

        public Runner(Logger logger)
        {
            _logger = logger;
        }

        public void Up(Settings setting)
        {
            Migrate(migration => migration.Up(setting));
        }

        public void Down(Settings setting)
        {
            Migrate(migration => migration.Down(setting));
        }

        private void Migrate(Action<IMigration> action)
        {
            var migrations = GetMigrations();
            foreach (var migration in migrations)
            {
                using (_logger.Scope("Execute migration: " + migration.GetType().Name))
                {
                    action(migration);
                }
            }
        }

        private IMigration[] GetMigrations()
        {
            var types = Assembly.GetEntryAssembly()
                .GetTypes()
                .Where(type => typeof(IMigration).IsAssignableFrom(type) && !type.IsAbstract);

            var migrations = types.Select(type => Activator.CreateInstance(type) as IMigration).ToArray();

            _logger.WriteLine("Migrations found: " + migrations.Length);

            return migrations;
        }
    }
}