
namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Queries
{
    public interface IHandleQuery<in TQuery, out TResult> where TQuery: IQuery<TResult>
    {
        TResult Handle(TQuery query);
    }
}