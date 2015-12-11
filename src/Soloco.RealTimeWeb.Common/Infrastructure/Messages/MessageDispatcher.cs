using System;
using System.Threading.Tasks;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;

namespace Soloco.RealTimeWeb.Common.Infrastructure.Messages
{
    public class MessageDispatcher : IMessageDispatcher
    {
        private readonly IResolver _container;

        public MessageDispatcher(IResolver container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            _container = container;
        }
        
        public async Task<TResult> Execute<TResult>(IMessage<TResult> message) 
        {
            if (message == null) throw new ArgumentNullException(nameof(message));

            var handler = GetHandler(message);

            return await handler.Handle((dynamic) message);
        }

        private dynamic GetHandler<TResult>(IMessage<TResult> message) 
        {
            var handlerType = typeof (IHandleMessage<,>)
                .MakeGenericType(message.GetType(), typeof (TResult));

            try
            {
                return _container.Resolve(handlerType, IfUnresolved.Throw);
            }
            catch (ContainerException exception)
            {
                throw new InvalidOperationException(
                    $"Handler {handlerType} for message : {message.GetType()} not found. " +
                    $"Did you call corresponding ContainerInitializer method while configuring the container?", exception);
            }
        }
    }
}