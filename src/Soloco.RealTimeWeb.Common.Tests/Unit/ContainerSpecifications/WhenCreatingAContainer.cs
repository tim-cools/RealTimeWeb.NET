using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Store;
using Soloco.RealTimeWeb.Common.Tests.Storage;
using Xunit;

namespace Soloco.RealTimeWeb.Common.Tests.Unit.ContainerSpecifications
{
    public class WhenCreatingAContainer
    {
        [Fact]
        public void ThenMessageHandlerShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer();

            ShouldBeNullExtensions.ShouldNotBeNull<ITestStoreDatabaseFactory>(container.GetInstance<ITestStoreDatabaseFactory>());
        }

        [Fact]
        public void ThenTheMessagaDispatcherShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer();

            ShouldBeNullExtensions.ShouldNotBeNull<IMessageDispatcher>(container.GetInstance<IMessageDispatcher>());
        }

        [Fact]
        public void ThenTheConnectionStringParserShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer();

            ShouldBeNullExtensions.ShouldNotBeNull<IConnectionStringParser>(container.GetInstance<IConnectionStringParser>());
        }
    }
}
