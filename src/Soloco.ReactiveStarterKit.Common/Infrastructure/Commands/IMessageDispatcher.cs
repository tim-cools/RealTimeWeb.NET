using System.Threading.Tasks;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Commands
{
    public interface IMessageDispatcher
    {
        Task<TResult> Execute<TResult>(IMessage<TResult> message); 
    }
}