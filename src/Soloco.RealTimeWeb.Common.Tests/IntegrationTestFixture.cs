using System;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common.Infrastructure;
using StructureMap;
using Soloco.RealTimeWeb.Common.Tests.Storage;

namespace Soloco.RealTimeWeb.Common.Tests
{
    public abstract class IntegrationTestFixture : IDisposable
    {
        private readonly IContainer _container;

        public IntegrationTestFixture()
        {
            LoggingInitializer.Initialize();

            var configuration = InitializeConfiguration();
            _container = InitializeContainer(configuration);

            InitializeDatabase();
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
            var builder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json");

            return builder.Build();
        }

        private IContainer InitializeContainer(IConfigurationRoot configuration)
        {
            var container = new Container(config =>
            {
                config.AddRegistry<CommonRegistry>();
                config.AddRegistry<TestRegistry>();
                config.For<IContext>().Use("Return context", context => context);

                config.For<IConfigurationRoot>().Use(configuration);

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