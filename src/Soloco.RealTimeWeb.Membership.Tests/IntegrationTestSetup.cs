using NUnit.Framework;
using Soloco.ReactiveStarterKit.Common;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Common.Tests;
using Soloco.ReactiveStarterKit.Common.Tests.Storage;

namespace Soloco.ReactiveStarterKit.Membership.Tests
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