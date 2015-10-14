
namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Commands
{
    public interface IHandleMessage<in TMessage, out TResult> where TMessage : IMessage<TResult>
    {
        TResult Handle(TMessage query);
    }
}