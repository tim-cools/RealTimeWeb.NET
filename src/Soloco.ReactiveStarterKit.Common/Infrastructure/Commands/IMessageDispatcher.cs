namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Commands
{
    public interface IMessageDispatcher
    {
        TResult Execute<TResult>(IMessage<TResult> message); 
    }
}