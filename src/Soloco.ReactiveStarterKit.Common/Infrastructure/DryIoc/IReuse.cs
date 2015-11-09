using System.Linq.Expressions;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Reuse goal is to locate or create scope where reused objects will be stored.</summary>
    /// <remarks><see cref="IReuse"/> implementors supposed to be stateless, and provide scope location behavior only.
    /// The reused service instances should be stored in scope(s).</remarks>
    public interface IReuse
    {
        /// <summary>Relative to other reuses lifespan value.</summary>
        int Lifespan { get; }

        /// <summary>Locates or creates scope to store reused service objects.</summary>
        /// <param name="request">Request to get context information or for example store something in resolution state.</param>
        /// <returns>Located scope.</returns>
        IScope GetScopeOrDefault(Request request);

        /// <summary>Supposed to create in-line expression with the same code as body of <see cref="GetScopeOrDefault"/> method.</summary>
        /// <param name="request">Request to get context information or for example store something in resolution state.</param>
        /// <returns>Expression of type <see cref="IScope"/>.</returns>
        /// <remarks>Result expression should be static: should Not create closure on any objects. 
        /// If you require to reference some item from outside, put it into <see cref="IContainer.ResolutionStateCache"/>.</remarks>
        Expression GetScopeExpression(Request request);

        /// <summary>Returns special id/index to lookup scoped item, or original passed factory id otherwise.</summary>
        /// <param name="factoryID">Id to map to item id/index.</param> <param name="request">Context to get access to scope.</param>
        /// <returns>id/index or source factory id.</returns>
        int GetScopedItemIdOrSelf(int factoryID, Request request);
    }
}