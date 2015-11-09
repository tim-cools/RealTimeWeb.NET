using System;
using System.Linq;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Tracks one current scope per thread, so the current scope in different tread would be different or null,
    /// if not yet tracked. Context actually stores scope references internally, so it should be disposed to free them.</summary>
    public sealed class ThreadScopeContext : IScopeContext, IDisposable
    {
        /// <summary>Provides static name for context. It is OK because its constant.</summary>
        public static readonly string ScopeContextName = "ThreadScopeContext";

        /// <summary>Key to identify context.</summary>
        public string RootScopeName { get { return ScopeContextName; } }

        /// <summary>Returns current scope in calling Thread or null, if no scope tracked.</summary>
        /// <returns>Found scope or null.</returns>
        public IScope GetCurrentOrDefault()
        {
            return _scopes.GetValueOrDefault(Portable.GetCurrentManagedThreadID()) as IScope;
        }

        /// <summary>Change current scope for the calling Thread.</summary>
        /// <param name="setCurrentScope">Delegate to change the scope given current one (or null).</param>
        /// <remarks>Important: <paramref name="setCurrentScope"/> may be called multiple times in concurrent environment.
        /// Make it predictable by removing any side effects.</remarks>
        public IScope SetCurrent(SetCurrentScopeHandler setCurrentScope)
        {
            var threadId = Portable.GetCurrentManagedThreadID();
            IScope newScope = null;
            Ref.Swap(ref _scopes, scopes =>
                scopes.AddOrUpdate(threadId, newScope = setCurrentScope(scopes.GetValueOrDefault(threadId) as IScope)));
            return newScope;
        }

        /// <summary>Disposed all stored/tracked scopes and empties internal scope storage.</summary>
        public void Dispose()
        {
            if (!_scopes.IsEmpty)
                foreach (var scope in _scopes.Enumerate().Where(scope => scope.Value is IDisposable))
                    ((IDisposable)scope.Value).Dispose();
            _scopes = ImTreeMapIntToObj.Empty;
        }

        private ImTreeMapIntToObj _scopes = ImTreeMapIntToObj.Empty;
    }
}