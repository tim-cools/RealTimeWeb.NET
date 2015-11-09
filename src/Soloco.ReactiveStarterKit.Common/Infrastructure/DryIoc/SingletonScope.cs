using System;
using System.Linq;
using System.Threading;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Scope implementation which will dispose stored <see cref="IDisposable"/> items on its own dispose.
    /// Locking is used internally to ensure that object factory called only once.</summary>
    public sealed class SingletonScope : IScope
    {
        private static readonly int MaxItemArrayIncreaseStep = 32;

        /// <summary>Parent scope in scope stack. Null for root scope.</summary>
        public IScope Parent { get { return null; } }

        /// <summary>Optional name object associated with scope.</summary>
        public object Name { get { return null; } }

        /// <summary>Creates scope.</summary>
        public SingletonScope()
        {
            _items = new object[0];
            _factoryIdToIndexMap = ImTreeMapIntToObj.Empty;
            _lastItemIndex = -1;
            _itemCreationLocker = new object();
        }

        /// <summary>Adds mapping between provide id and index for new stored item. Returns index.</summary>
        /// <param name="externalId">External id mapped to internal index.</param>
        /// <returns>Already mapped index, or newly created.</returns>
        public int GetScopedItemIdOrSelf(int externalId)
        {
            var index = _factoryIdToIndexMap.GetValueOrDefault(externalId);
            if (index != null)
                return (int)index;

            var newIndex = Interlocked.Increment(ref _lastItemIndex);
            if (newIndex >= _items.Length)
                EnsureIndexExist(newIndex);

            Ref.Swap(ref _factoryIdToIndexMap, idToIndex => idToIndex.AddOrUpdate(externalId, newIndex));
            return newIndex;
        }

        /// <summary><see cref="IScope.GetOrAdd"/> for description.
        /// Will throw <see cref="ContainerException"/> if scope is disposed.</summary>
        /// <param name="id">Unique ID to find created object in subsequent calls.</param>
        /// <param name="createValue">Delegate to create object. It will be used immediately, and reference to delegate will Not be stored.</param>
        /// <returns>Created and stored object.</returns>
        /// <exception cref="ContainerException">if scope is disposed.</exception>
        public object GetOrAdd(int id, CreateScopedValue createValue)
        {
            return (id < _items.Length ? _items[id] : null) ?? TryGetOrAddToArray(id, createValue);
        }

        /// <summary>Gets item or null if nothing stored.</summary>
        /// <param name="id">Id to search for.</param>
        /// <returns>Stored item or null.</returns>
        public object GetItemOrDefault(int id)
        {
            return id < _items.Length ? _items[id] : null;
        }

        /// <summary>Sets (replaces) value at specified id, or adds value if no existing id found.</summary>
        /// <param name="id">To set value at.</param> <param name="item">Value to set.</param>
        public void SetOrAdd(int id, object item)
        {
            Throw.If(_disposed == 1, Error.ScopeIsDisposed);
            Ref.Swap(ref _items, items => { items[id] = item; return items; });
        }

        /// <summary>Disposes all stored <see cref="IDisposable"/> objects and nullifies object storage.</summary>
        /// <remarks>If item disposal throws exception, then it won't be propagated outside, so the rest of the items could be disposed.</remarks>
        public void Dispose()
        {
            if (Interlocked.CompareExchange(ref _disposed, 1, 0) == 1) return;
            var factoryIdToIndexMap = _factoryIdToIndexMap;
            if (!factoryIdToIndexMap.IsEmpty)
                foreach (var idToIndex in factoryIdToIndexMap.Enumerate().OrderByDescending(it => it.Key))
                    Scope.DisposeItem(_items[(int)idToIndex.Value]);
            _factoryIdToIndexMap = ImTreeMapIntToObj.Empty;
            _items = ArrayTools.Empty<object>();
        }

        /// <summary>Prints scope info (name and parent) to string for debug purposes.</summary> <returns>String representation.</returns>
        public override string ToString()
        {
            return "{SingletonScope}";
        }

        #region Implementation

        private ImTreeMapIntToObj _factoryIdToIndexMap;
        private object[] _items;
        private int _lastItemIndex;
        private int _disposed;

        // Sync root is required to create object only once. The same reason as for Lazy<T>.
        private readonly object _itemCreationLocker;

        private void EnsureIndexExist(int index)
        {
            Ref.Swap(ref _items, items =>
            {
                var size = items.Length;
                if (index < size)
                    return items;

                var newSize = Math.Max(index + 1, size + MaxItemArrayIncreaseStep);
                var newItems = new object[newSize];
                Array.Copy(items, 0, newItems, 0, size);
                return newItems;
            });
        }

        private object TryGetOrAddToArray(int itemIndex, CreateScopedValue createValue)
        {
            Throw.If(_disposed == 1, Error.ScopeIsDisposed);

            if (itemIndex >= _items.Length)
                EnsureIndexExist(itemIndex);

            object item;
            lock (_itemCreationLocker)
            {
                item = _items[itemIndex];
                if (item != null)
                    return item;
                item = createValue();
            }

            Ref.Swap(ref _items, items => { items[itemIndex] = item; return items; });
            return item;
        }

        #endregion
    }
}