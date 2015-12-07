using System;
using System.Linq;
using System.Reflection;
using Soloco.RealTimeWeb.Environment.Migrations;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal class Runner
    {
        private readonly Logger _logger;

        public Runner(Logger logger)
        {
            _logger = logger;
        }

        public void Up(MigrationContext context)
        {
            Migrate(context, migration => migration.Up());
        }

        public void Down(MigrationContext context)
        {
            Migrate(context, migration => migration.Down());
        }

        private void Migrate(MigrationContext context, Action<IMigration> action)
        {
            var migrations = GetMigrations(context);
            foreach (var migration in migrations)
            {
                using (_logger.Scope("Execute migration: " + migration.GetType().Name))
                {
                    action(migration);
                }
            }
        }

        private IMigration[] GetMigrations(MigrationContext context)
        {
            var types = typeof(Runner)
                .Assembly
                .GetTypes()
                .Where(type => typeof(IMigration).IsAssignableFrom(type) && !type.IsAbstract);

            var migrations = types.Select(type => CreateInstance(type, context)).ToArray();

            _logger.WriteLine("Migrations found: " + migrations.Length);

            return migrations;
        }

        private IMigration CreateInstance(Type type, MigrationContext context)
        {
            var constructor = type.GetConstructor(new [] { typeof(MigrationContext) });
            if (constructor == null)
            {
                throw new InvalidOperationException($"Type '{type.FullName}' has no constructor accepting on parameter of type 'MigrationContext'");
            }
            return constructor.Invoke(new [] { context }) as IMigration;
        }
    }
}