using System;
using System.Threading.Tasks;
using Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Commands
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

            var handler = GetHandler(message);

            return await handler.Handle((dynamic) message);
        }

        private dynamic GetHandler<TResult>(IMessage<TResult> message) 
        {
            var handlerType = typeof (IHandleMessage<,>)
                .MakeGenericType(message.GetType(), typeof (TResult));

            var handler = _container.Resolve(handlerType, IfUnresolved.ReturnDefault);
            if (handler == null)
            {
                throw new InvalidOperationException(
                    $"Handler {handlerType} for message : {message.GetType()} not found. Did you call corresponding ContainerInitializer method while configuring the container?");
            }
            return handler;
        }
    }
}