using System;
using NUnit.Framework;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;

namespace Soloco.RealTimeWeb.Membership.Tests.Integration
{
    public static class MessageDispatcherExtensions
    {
        public static T ExecuteNowWithTimeout<T>(this IMessageDispatcher messageDispatcher, IMessage<T> message)
        {
            if (messageDispatcher == null) throw new ArgumentNullException(nameof(messageDispatcher));
            if (message == null) throw new ArgumentNullException(nameof(message));

            var task = messageDispatcher.Execute(message);
            if (!task.Wait(300000))
            {
                throw new AssertionException("Timeout on executing message.");
            }
            return task.Result;
        }
    }
}
