using System;
using System.Linq.Expressions;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>This factory is the thin wrapper for user provided delegate 
    /// and where possible it uses delegate directly: without converting it to expression.</summary>
    public sealed class DelegateFactory : Factory
    {
        /// <summary>Non-abstract closed implementation type.</summary>
        public override Type ImplementationType { get { return _knownImplementationType; } }

        /// <summary>Creates factory by providing:</summary>
        /// <param name="factoryDelegate">User specified service creation delegate.</param>
        /// <param name="reuse">(optional) Reuse behavior for created service.</param>
        /// <param name="setup">(optional) Additional settings.</param>
        /// <param name="knownImplementationType">(optional) Implementation type if known, e.g. when registering existing instance.</param>
        public DelegateFactory(Func<IResolver, object> factoryDelegate,
            IReuse reuse = null, Setup setup = null, Type knownImplementationType = null)
            : base(reuse, setup)
        {
            _factoryDelegate = factoryDelegate.ThrowIfNull();
            _knownImplementationType = knownImplementationType;
        }

        /// <summary>Create expression by wrapping call to stored delegate with provided request.</summary>
        /// <param name="request">Request to resolve. It will be stored in resolution state to be passed to delegate on actual resolve.</param>
        /// <returns>Created delegate call expression.</returns>
        public override Expression CreateExpressionOrDefault(Request request)
        {
            var factoryDelegateExpr = request.Container.GetOrAddStateItemExpression(_factoryDelegate);
            return Expression.Convert(Expression.Invoke(factoryDelegateExpr, Container.ResolverExpr), request.ServiceType);
        }

        /// <summary>If possible returns delegate directly, without creating expression trees, just wrapped in <see cref="FactoryDelegate"/>.
        /// If decorator found for request then factory fall-backs to expression creation.</summary>
        /// <param name="request">Request to resolve.</param> 
        /// <returns>Factory delegate directly calling wrapped delegate, or invoking expression if decorated.</returns>
        public override FactoryDelegate GetDelegateOrDefault(Request request)
        {
            request = request.WithResolvedFactory(this);

            if (FactoryType == FactoryType.Service &&
                request.Container.GetDecoratorExpressionOrDefault(request) != null)
                return base.GetDelegateOrDefault(request); // via expression creation

            var rules = request.Container.Rules;
            var reuse = rules.ReuseMapping == null ? Reuse : rules.ReuseMapping(Reuse, request);
            ThrowIfReuseHasShorterLifespanThanParent(reuse, request);

            if (reuse != null)
                return base.GetDelegateOrDefault(request); // use expression creation

            return (state, r, scope) => _factoryDelegate(r.Resolver);
        }

        private readonly Func<IResolver, object> _factoryDelegate;
        private readonly Type _knownImplementationType;
    }
}