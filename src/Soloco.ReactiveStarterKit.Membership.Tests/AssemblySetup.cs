using NUnit.Framework;
using Soloco.ReactiveStarterKit.Common;
using Soloco.ReactiveStarterKit.Common.Tests;

namespace Soloco.ReactiveStarterKit.Membership.Tests
{
    [SetUpFixture]
    public class IntegrationTestSetup
    {
        [SetUp]
        public void Setup()
        {
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