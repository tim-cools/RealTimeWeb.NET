using System.Collections;
using System.Collections.Generic;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Resolves all registered services of <typeparamref name="TService"/> type on demand, 
    /// when enumerator <see cref="IEnumerator.MoveNext"/> called. If service type is not found, empty returned.</summary>
    /// <typeparam name="TService">Service type to resolve.</typeparam>
    public sealed class LazyEnumerable<TService> : IEnumerable<TService>
    {
        /// <summary>Exposes internal items enumerable.</summary>
        public readonly IEnumerable<TService> Items;

        /// <summary>Wraps lazy resolved items.</summary> <param name="items">Lazy resolved items.</param>
        public LazyEnumerable(IEnumerable<TService> items)
        {
            Items = items.ThrowIfNull();
        }

        /// <summary>Return items enumerator.</summary> <returns>items enumerator.</returns>
        public IEnumerator<TService> GetEnumerator()
        {
            return Items.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator() { return GetEnumerator(); }
    }
}