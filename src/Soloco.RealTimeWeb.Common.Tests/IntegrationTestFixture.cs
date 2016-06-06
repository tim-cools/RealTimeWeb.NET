using System;
using System.Diagnostics;
using System.IO;
using Microsoft.Extensions.Configuration;
using StructureMap;
using Soloco.RealTimeWeb.Common.Tests.Storage;

namespace Soloco.RealTimeWeb.Common.Tests
{
    public abstract class IntegrationTestFixture : IDisposable
    {
        private readonly IContainer _container;

        protected IntegrationTestFixture()
        {
            LoggingInitializer.Initialize();

            var configuration = InitializeConfiguration();
            _container = InitializeContainer(configuration);

            // InitializeDatabase();
        }

        public IContainer OpenContainerScope()
        {
            return _container.CreateChildContainer();
        }

        private void InitializeDatabase()
        {
            var factory = _container.GetInstance<ITestStoreDatabaseFactory>();
            factory.CreateCleanStoreDatabase();
        }

        private IConfigurationRoot InitializeConfiguration()
        {
            var environment = System.Environment.GetEnvironmentVariable("Hosting:Environment") ?? "local"; //todo should be WebHostBuilder.EnvironmentKey instead of hard coded
            var builder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.tests.json")
                .AddJsonFile($"appsettings.tests.{environment}.json", true);

            return builder.Build();
        }

        private IContainer InitializeContainer(IConfiguration configuration)
        {
            var container = new Container(config =>
            {
                config.AddRegistry<CommonRegistry>();
                config.AddRegistry<TestRegistry>();
                config.For<IContext>().Use("Return context", context => context);

                config.For<IConfiguration>().Use(configuration);

                InitializeContainer(config);
            });

            return container;
        }

        protected abstract void InitializeContainer(ConfigurationExpression configuration);

        public void Dispose()
        {
            _container.Dispose();
        }
    }
}