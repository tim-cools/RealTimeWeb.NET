using System.Threading.Tasks;
using Soloco.RealTimeWeb.Common.Messages;

namespace Soloco.RealTimeWeb.Common.Tests.Unit.ContainerSpecifications
{
    public class DummyMessageHandler : IHandleMessage<TestMessage, TestMessage>
    {
        public DummyMessageHandler(IDummySession session)
        {
            
        }

        public Task<TestMessage> Handle(TestMessage command)
        {
            return Task.FromResult(new TestMessage());
        }
    }
}