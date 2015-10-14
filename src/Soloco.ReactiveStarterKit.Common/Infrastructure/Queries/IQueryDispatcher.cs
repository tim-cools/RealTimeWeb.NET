namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Queries
{
    public interface IQueryDispatcher
    {
        TResult Execute<TResult>(IQuery<TResult> query);
    }
}
