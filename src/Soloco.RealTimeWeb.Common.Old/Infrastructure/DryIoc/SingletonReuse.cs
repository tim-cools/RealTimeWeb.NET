using System.Linq.Expressions;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Returns container bound scope for storing singleton objects.</summary>
    public sealed class SingletonReuse : IReuse
    {
        /// <summary>Relative to other reuses lifespan value.</summary>
        public int Lifespan { get { return 1000; } }

        /// <summary>Returns container bound Singleton scope.</summary>
        /// <param name="request">Request to get context information or for example store something in resolution state.</param>
        /// <returns>Container singleton scope.</returns>
        public IScope GetScopeOrDefault(Request request)
        {
            return request.Scopes.SingletonScope;
        }

        /// <summary>Returns expression directly accessing <see cref="IScopeAccess.SingletonScope"/>.</summary>
        /// <param name="request">Request to get context information or for example store something in resolution state.</param>
        /// <returns>Singleton scope property expression.</returns>
        public Expression GetScopeExpression(Request request)
        {
            return Expression.Property(Container.ScopesExpr, "SingletonScope");
        }

        /// <summary>Returns index of new item in singleton scope.</summary>
        /// <param name="factoryID">Factory id to map to new item index.</param>
        /// <param name="request">Context to get singleton scope from.</param>
        /// <returns>Index in scope.</returns>
        public int GetScopedItemIdOrSelf(int factoryID, Request request)
        {
            return request.Scopes.SingletonScope.GetScopedItemIdOrSelf(factoryID);
        }

        /// <summary>Pretty print reuse name and lifespan</summary> <returns>Printed string.</returns>
        public override string ToString() { return GetType().Name + " {Lifespan=" + Lifespan + "}"; }
    }
}