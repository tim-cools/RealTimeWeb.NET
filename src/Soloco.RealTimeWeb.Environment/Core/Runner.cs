using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace Soloco.RealTimeWeb.Environment.Core
{
    internal class Runner
    {
        private readonly Logger _logger;

        public Runner(Logger logger)
        {
            _logger = logger;
        }

        public async Task Up(MigrationContext context)
        {
            var migrations = GetMigrations(context);
            await Migrate(context, migrations, migration => migration.Up());
        }

        public async Task Down(MigrationContext context)
        {
            var migrations = GetMigrations(context);
            await Migrate(context, migrations.Reverse(), migration => migration.Down());
        }

        private async Task Migrate(MigrationContext context, IEnumerable<Type> migrations, Func<IMigration, Task> action)
        {
            foreach (var migration in migrations.Select(type => CreateInstance(type, context)))
            {
                using (_logger.Scope("Execute migration: " + migration.GetType().Name))
                {
                    await Migrate(migration, action);
                }
            }
        }

        private Task Migrate(IMigration migration, Func<IMigration, Task> action)
        {
            try
            {
                return action(migration);
            }
            finally
            {
                var disposable = migration as IDisposable;
                disposable?.Dispose();
            }
        }

        private Type[] GetMigrations(MigrationContext context)
        {
            var types = typeof(Runner)
                .GetTypeInfo()
                .Assembly
                .GetTypes()
                .Where(type => typeof(IMigration).IsAssignableFrom(type) && !type.GetTypeInfo().IsAbstract);

            var migrations = types.ToArray();

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