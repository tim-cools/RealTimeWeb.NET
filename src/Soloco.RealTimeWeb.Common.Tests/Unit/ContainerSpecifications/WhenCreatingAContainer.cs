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

            container.GetInstance<ITestStoreDatabaseFactory>().ShouldNotBeNull();
        }

        [Fact]
        public void ThenTheMessagaDispatcherShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer();

            container.GetInstance<IMessageDispatcher>().ShouldNotBeNull();
        }

        [Fact]
        public void ThenTheConnectionStringParserShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer();

            container.GetInstance<IConnectionStringParser>().ShouldNotBeNull();
        }
    }
}
