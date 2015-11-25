using System;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Specifies pre-defined reuse behaviors supported by container: 
    /// used when registering services into container with <see cref="Registrator"/> methods.</summary>
    public static class Reuse
    {
        /// <summary>Synonym for absence of reuse.</summary>
        public static readonly IReuse Transient = null; // no reuse.

        /// <summary>Specifies to store single service instance per <see cref="Container"/>.</summary>
        public static readonly IReuse Singleton = new SingletonReuse();

        /// <summary>Specifies to store single service instance per resolution root created by <see cref="Resolver"/> methods.</summary>
        public static readonly IReuse InResolutionScope = new ResolutionScopeReuse();

        /// <summary>Specifies to store single service instance per current/open scope created with <see cref="Container.OpenScope"/>.</summary>
        public static readonly IReuse InCurrentScope = new CurrentScopeReuse();

        /// <summary>Returns current scope reuse with specific name to match with scope.
        /// If name is not specified then function returns <see cref="InCurrentScope"/>.</summary>
        /// <param name="name">(optional) Name to match with scope.</param>
        /// <returns>Created current scope reuse.</returns>
        public static IReuse InCurrentNamedScope(object name = null)
        {
            return name == null ? InCurrentScope : new CurrentScopeReuse(name);
        }

        /// <summary>Creates reuse to search for <paramref name="assignableFromServiceType"/> and <paramref name="serviceKey"/>
        /// in existing resolution scope hierarchy. If parameters are not specified or null, then <see cref="InResolutionScope"/> will be returned.</summary>
        /// <param name="assignableFromServiceType">(optional) To search for scope with service type assignable to type specified in parameter.</param>
        /// <param name="serviceKey">(optional) Search for specified key.</param>
        /// <param name="outermost">If true - commands to look for outermost match instead of nearest.</param>
        /// <returns>New reuse with specified parameters or <see cref="InResolutionScope"/> if nothing specified.</returns>
        public static IReuse InResolutionScopeOf(Type assignableFromServiceType = null, object serviceKey = null, bool outermost = false)
        {
            return assignableFromServiceType == null && serviceKey == null ? InResolutionScope
                : new ResolutionScopeReuse(assignableFromServiceType, serviceKey, outermost);
        }

        /// <summary>Creates reuse to search for <typeparamref name="TAssignableFromServiceType"/> and <paramref name="serviceKey"/>
        /// in existing resolution scope hierarchy.</summary>
        /// <typeparam name="TAssignableFromServiceType">To search for scope with service type assignable to type specified in parameter.</typeparam>
        /// <param name="serviceKey">(optional) Search for specified key.</param>
        /// <param name="outermost">If true - commands to look for outermost match instead of nearest.</param>
        /// <returns>New reuse with specified parameters.</returns>
        public static IReuse InResolutionScopeOf<TAssignableFromServiceType>(object serviceKey = null, bool outermost = false)
        {
            return InResolutionScopeOf(typeof(TAssignableFromServiceType), serviceKey, outermost);
        }

        /// <summary>Ensuring single service instance per Thread.</summary>
        public static readonly IReuse InThread = InCurrentNamedScope(ThreadScopeContext.ScopeContextName);

        /// <summary>Special name that by convention recognized by <see cref="InWebRequest"/>.</summary>
        public static readonly string WebRequestScopeName = "WebRequestScopeName";

        /// <summary>Web request is just convention for reuse in <see cref="InCurrentNamedScope"/> with special name <see cref="WebRequestScopeName"/>.</summary>
        public static readonly IReuse InWebRequest = InCurrentNamedScope(WebRequestScopeName);
    }
}