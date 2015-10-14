namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Queries
{
    public interface IHandleListQuery<in TQuery, out TEntity> : IHandleQuery<TQuery, TEntity[]>
            where TQuery : IQuery<TEntity[]>
    {
    }
}