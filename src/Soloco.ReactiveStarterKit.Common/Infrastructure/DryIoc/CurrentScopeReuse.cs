using System;
using System.Linq.Expressions;
using System.Text;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Returns container bound current scope created by <see cref="Container.OpenScope"/> method.</summary>
    /// <remarks>It is the same as Singleton scope if container was not created by <see cref="Container.OpenScope"/>.</remarks>
    public sealed class CurrentScopeReuse : IReuse
    {
        /// <summary>Name to find current scope or parent with equal name.</summary>
        public readonly object Name;

        /// <summary>Relative to other reuses lifespan value.</summary>
        public int Lifespan { get { return 100; } }

        /// <summary>Creates reuse optionally specifying its name.</summary> 
        /// <param name="name">(optional) Used to find matching current scope or parent.</param>
        public CurrentScopeReuse(object name = null)
        {
            Name = name;
        }

        /// <summary>Returns container current scope or if <see cref="Name"/> specified: current scope or its parent with corresponding name.</summary>
        /// <param name="request">Request to get context information or for example store something in resolution state.</param>
        /// <returns>Found current scope or its parent.</returns>
        /// <exception cref="ContainerException">with the code <see cref="Error.NoMatchedScopeFound"/> if <see cref="Name"/> specified but
        /// no matching scope or its parent found.</exception>
        public IScope GetScopeOrDefault(Request request)
        {
            return request.Scopes.GetCurrentNamedScope(Name, false);
        }

        /// <summary>Returns <see cref="IScopeAccess.GetCurrentNamedScope"/> method call expression.</summary>
        /// <param name="request">Request to get context information or for example store something in resolution state.</param>
        /// <returns>Method call expression returning matched current scope.</returns>
        public Expression GetScopeExpression(Request request)
        {
            var nameExpr = request.Container.GetOrAddStateItemExpression(Name, typeof(object));
            return Expression.Call(Container.ScopesExpr, "GetCurrentNamedScope", ArrayTools.Empty<Type>(),
                nameExpr, Expression.Constant(true));
        }

        /// <summary>Just returns back passed id without changes.</summary>
        /// <param name="factoryID">Id to return back.</param> <param name="request">Ignored.</param>
        /// <returns><paramref name="factoryID"/></returns>
        public int GetScopedItemIdOrSelf(int factoryID, Request request)
        {
            return factoryID;
        }

        /// <summary>Pretty prints reuse to string.</summary> <returns>Reuse string.</returns>
        public override string ToString()
        {
            var s = new StringBuilder(GetType().Name + " {");
            if (Name != null)
                s.Append("Name=").Print(Name, "\"").Append(", ");
            return s.Append("Lifespan=").Append(Lifespan).Append("}").ToString();
        }
    }
}