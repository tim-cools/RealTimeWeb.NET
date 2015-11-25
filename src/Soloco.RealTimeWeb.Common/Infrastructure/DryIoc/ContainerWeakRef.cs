using System;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Wraps <see cref="IContainer"/> WeakReference with more specialized exceptions on access to GCed or disposed container.</summary>
    public sealed class ContainerWeakRef : IResolverContext
    {
        /// <summary>Provides access to resolver implementation.</summary>
        public IResolver Resolver { get { return GetTarget(); } }

        /// <summary>Scope access.</summary>
        public IScopeAccess Scopes { get { return GetTarget(); } }

        /// <summary>Container access.</summary>
        public IContainer Container { get { return GetTarget(); } }

        /// <summary>Creates weak reference wrapper over passed container object.</summary> <param name="container">Object to wrap.</param>
        public ContainerWeakRef(IContainer container) { _ref = new WeakReference(container); }

        private readonly WeakReference _ref;
        private Container GetTarget()
        {
            var container = _ref.Target as Container;
            return container.ThrowIfNull(Error.ContainerIsGarbageCollected)
                // ReSharper disable once PossibleNullReferenceException
                .ThrowIf(container.IsDisposed, Error.ContainerIsDisposed);
        }
    }
}