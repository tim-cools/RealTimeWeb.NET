using Shouldly;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Infrastructure.Store;
using Soloco.RealTimeWeb.Common.Tests.Storage;
using Xunit;

namespace Soloco.RealTimeWeb.Common.Tests.Unit.MessageDispatcher
{
    public class WhenExecutingAMessage
    {
        [Fact]
        public void ThenTheMessageHandlerShouldHaveItsOwnSession()
        {
            DummeDocumentSession session = null;
            var container = TestContainerFactory.CreateContainer(config =>
            {
                config.For<IDummySession>().Use("TestSession", context => session = new DummeDocumentSession()).ContainerScoped();
                config.For<IHandleMessage<TestMessage, TestMessage>>().Use<DummyMessageHandler>();
            });

            var dispatcher = container.GetInstance<IMessageDispatcher>();
            dispatcher.ShouldNotBeNull();

            dispatcher.Execute(new TestMessage());

            session.ShouldNotBeNull();
            session.Disposed.ShouldBeTrue();
        }
    }
}
