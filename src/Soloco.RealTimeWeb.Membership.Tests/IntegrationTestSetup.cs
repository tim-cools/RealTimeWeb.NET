using NUnit.Framework;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Common.Infrastructure;
using Soloco.RealTimeWeb.Common.Tests;
using Soloco.RealTimeWeb.Common.Tests.Storage;

namespace Soloco.RealTimeWeb.Membership.Tests
{
    [SetUpFixture]
    public class IntegrationTestSetup
    {
        [SetUp]
        public void Setup()
        {
            LoggingInitializer.Initialize();
            TestStoreDatabaseFactory.CreateCleanStoreDatabase();

            TestContainer.Initialize(container => container
                .RegisterCommon()
                .RegisterMembership());
        }

        [TearDown]
        public void TearDown()
        {
            TestContainer.Dispose();
        }
    }
}