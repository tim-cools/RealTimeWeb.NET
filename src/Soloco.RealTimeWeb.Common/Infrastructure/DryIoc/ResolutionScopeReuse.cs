using System;
using System.Linq;
using System.Linq.Expressions;
using System.Text;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Represents services created once per resolution root (when some of Resolve methods called).</summary>
    /// <remarks>Scope is created only if accessed to not waste memory.</remarks>
    public sealed class ResolutionScopeReuse : IReuse
    {
        /// <summary>Relative to other reuses lifespan value.</summary>
        public int Lifespan { get { return 0; } }

        /// <summary>Creates new resolution scope reuse with specified type and key.</summary>
        /// <param name="assignableFromServiceType">(optional)</param> <param name="serviceKey">(optional)</param>
        /// <param name="outermost">(optional)</param>
        public ResolutionScopeReuse(Type assignableFromServiceType = null, object serviceKey = null, bool outermost = false)
        {
            _assignableFromServiceType = assignableFromServiceType;
            _serviceKey = serviceKey;
            _outermost = outermost;
        }

        /// <summary>Creates or returns already created resolution root scope.</summary>
        /// <param name="request">Request to get context information or for example store something in resolution state.</param>
        /// <returns>Created or existing scope.</returns>
        public IScope GetScopeOrDefault(Request request)
        {
            var scope = request.Scope;
            if (scope == null)
            {
                var parent = request.Enumerate().Last();
                request.Scopes.GetOrCreateResolutionScope(ref scope, parent.ServiceType, parent.ServiceKey);
            }

            return request.Scopes.GetMatchingResolutionScope(scope, _assignableFromServiceType, _serviceKey, _outermost, false);
        }

        /// <summary>Returns <see cref="IScopeAccess.GetMatchingResolutionScope"/> method call expression.</summary>
        /// <param name="request">Request to get context information or for example store something in resolution state.</param>
        /// <returns>Method call expression returning existing or newly created resolution scope.</returns>
        public Expression GetScopeExpression(Request request)
        {
            return Expression.Call(Container.ScopesExpr, "GetMatchingResolutionScope", ArrayTools.Empty<Type>(),
                Container.GetResolutionScopeExpression(request),
                Expression.Constant(_assignableFromServiceType, typeof(Type)),
                request.Container.GetOrAddStateItemExpression(_serviceKey, typeof(object)),
                Expression.Constant(_outermost, typeof(bool)),
                Expression.Constant(true, typeof(bool)));
        }

        /// <summary>Just returns back passed id without changes.</summary>
        /// <param name="factoryID">Id to return back.</param> <param name="request">Ignored.</param>
        /// <returns><paramref name="factoryID"/></returns>
        public int GetScopedItemIdOrSelf(int factoryID, Request request)
        {
            return factoryID;
        }

        /// <summary>Pretty print reuse name and lifespan</summary> <returns>Printed string.</returns>
        public override string ToString()
        {
            var s = new StringBuilder().Append(GetType().Name)
                .Append(" {Name={").Print(_assignableFromServiceType)
                .Append(", ").Print(_serviceKey, "\"")
                .Append("}}");
            return s.ToString();
        }

        private readonly Type _assignableFromServiceType;
        private readonly object _serviceKey;
        private readonly bool _outermost;
    }
}