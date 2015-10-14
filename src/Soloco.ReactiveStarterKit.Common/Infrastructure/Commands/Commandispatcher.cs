using System;
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

        public TResult Execute<TResult>(IMessage<TResult> message) 
        {
            if (message == null) throw new ArgumentNullException(nameof(message));

            var handler = GetHandler(message);

            return handler.Handle((dynamic) message);
        }

        private dynamic GetHandler<TResult>(IMessage<TResult> message) 
        {
            var handlerType = typeof (IHandleMessage<,>)
                .MakeGenericType(message.GetType(), typeof (TResult));

            return _container.Resolve(handlerType);
        }
    }
}