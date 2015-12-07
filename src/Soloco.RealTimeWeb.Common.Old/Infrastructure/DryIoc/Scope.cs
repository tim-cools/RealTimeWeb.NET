using System;
using System.Linq;
using System.Threading;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Scope implementation which will dispose stored <see cref="IDisposable"/> items on its own dispose.
    /// Locking is used internally to ensure that object factory called only once.</summary>
    public sealed class Scope : IScope
    {
        /// <summary>Parent scope in scope stack. Null for root scope.</summary>
        public IScope Parent { get; private set; }

        /// <summary>Optional name object associated with scope.</summary>
        public object Name { get; private set; }

        /// <summary>Create scope with optional parent and name.</summary>
        /// <param name="parent">Parent in scope stack.</param> <param name="name">Associated name object.</param>
        public Scope(IScope parent = null, object name = null)
        {
            Parent = parent;
            Name = name;
            _items = ImTreeMapIntToObj.Empty;
        }

        /// <summary>Just returns back <paramref name="externalId"/> without any changes.</summary>
        /// <param name="externalId">Id will be returned back.</param> <returns><paramref name="externalId"/>.</returns>
        public int GetScopedItemIdOrSelf(int externalId)
        {
            return externalId;
        }

        /// <summary><see cref="IScope.GetOrAdd"/> for description.
        /// Will throw <see cref="ContainerException"/> if scope is disposed.</summary>
        /// <param name="id">Unique ID to find created object in subsequent calls.</param>
        /// <param name="createValue">Delegate to create object. It will be used immediately, and reference to delegate will Not be stored.</param>
        /// <returns>Created and stored object.</returns>
        /// <exception cref="ContainerException">if scope is disposed.</exception>
        public object GetOrAdd(int id, CreateScopedValue createValue)
        {
            return _items.GetValueOrDefault(id) ?? TryGetOrAdd(id, createValue);
        }

        /// <summary>Gets item or null if nothing stored.</summary>
        /// <param name="id">Id to search for.</param>
        /// <returns>Stored item or null.</returns>
        public object GetItemOrDefault(int id)
        {
            return _items.GetValueOrDefault(id);
        }

        private object TryGetOrAdd(int id, CreateScopedValue createValue)
        {
            Throw.If(_disposed == 1, Error.ScopeIsDisposed);

            object item;
            lock (_itemCreationLocker)
            {
                item = _items.GetValueOrDefault(id);
                if (item != null)
                    return item;
                item = createValue();
            }

            Ref.Swap(ref _items, items => items.AddOrUpdate(id, item));
            return item;
        }

        /// <summary>Sets (replaces) value at specified id, or adds value if no existing id found.</summary>
        /// <param name="id">To set value at.</param> <param name="item">Value to set.</param>
        public void SetOrAdd(int id, object item)
        {
            Throw.If(_disposed == 1, Error.ScopeIsDisposed);
            Ref.Swap(ref _items, items => items.AddOrUpdate(id, item));
        }

        /// <summary>Disposes all stored <see cref="IDisposable"/> objects and nullifies object storage.</summary>
        /// <remarks>If item disposal throws exception, then it won't be propagated outside, so the rest of the items could be disposed.</remarks>
        public void Dispose()
        {
            if (Interlocked.CompareExchange(ref _disposed, 1, 0) == 1) return;
            var items = _items;
            if (!items.IsEmpty)
                foreach (var item in items.Enumerate().OrderByDescending(it => it.Key))
                    DisposeItem(item.Value);
            _items = ImTreeMapIntToObj.Empty;
        }

        /// <summary>Prints scope info (name and parent) to string for debug purposes.</summary> <returns>String representation.</returns>
        public override string ToString()
        {
            return "{" +
                   (Name != null ? "Name=" + Name + ", " : string.Empty) +
                   (Parent == null ? "Parent=null" : "Parent=" + Parent)
                   + "}";
        }

        #region Implementation

        private ImTreeMapIntToObj _items;
        private int _disposed;

        // Sync root is required to create object only once. The same reason as for Lazy<T>.
        private readonly object _itemCreationLocker = new object();

        internal static void DisposeItem(object item)
        {
            var disposable = item as IDisposable;
            if (disposable == null)
            {
                // Unwrap WeakReference if item wrapped in it.
                var weakRefItem = item as WeakReference;
                if (weakRefItem != null)
                    disposable = weakRefItem.Target as IDisposable;
            }

            if (disposable != null)
                try { disposable.Dispose(); }
                catch (Exception)
                {
                    // NOTE Ignoring disposing exception, they not so important for program to proceed.
                }
        }

        #endregion
    }
}