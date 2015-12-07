using System;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;
using Soloco.RealTimeWeb.Common.Tests.Storage;

namespace Soloco.RealTimeWeb.Common.Tests
{
    public class IntegrationTestFixture : IDisposable
    {
        public IContainer Container { get; }

        public IntegrationTestFixture()
        {
            LoggingInitializer.Initialize();

            TestStoreDatabaseFactory.CreateCleanStoreDatabase();

            Container = new Container();
            Container.RegisterCommon();
        }

        public void Dispose()
        {
            Container.Dispose();
        }
    }
}