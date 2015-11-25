using System.Threading.Tasks;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Messages
{
    public interface IMessageDispatcher
    {
        Task<TResult> Execute<TResult>(IMessage<TResult> message); 
    }
}