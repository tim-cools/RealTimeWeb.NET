using System.Collections.Generic;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.Queries
{
    public interface IListQuery<T> : IQuery<IEnumerable<T>>
    {
    }
}