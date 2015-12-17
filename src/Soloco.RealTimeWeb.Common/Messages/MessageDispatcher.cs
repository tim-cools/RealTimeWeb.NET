using System;
using System.Threading.Tasks;
using StructureMap;

namespace Soloco.RealTimeWeb.Common.Infrastructure.Messages
{
    public class MessageDispatcher : IMessageDispatcher
    {
        private readonly IContainer _container;

        public MessageDispatcher(IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            _container = container;
        }
        
        public async Task<TResult> Execute<TResult>(IMessage<TResult> message) 
        {
            if (message == null) throw new ArgumentNullException(nameof(message));

            using (var context = _container.CreateChildContainer())
            {
                var handler = GetHandler(context, message);

                return await handler.Handle((dynamic) message);
            }
        }

        private static dynamic GetHandler<TResult>(IContainer container, IMessage<TResult> message) 
        {
            var handlerType = typeof (IHandleMessage<,>)
                .MakeGenericType(message.GetType(), typeof (TResult));

            try
            {
                return container.GetInstance(handlerType);
            }
            catch (Exception exception)
            {
                throw new InvalidOperationException(
                    $"Handler {handlerType} for message : {message.GetType()} not found. " +
                    $"Did you call corresponding ContainerInitializer method while configuring the container?", exception);
            }
        }
    }
}