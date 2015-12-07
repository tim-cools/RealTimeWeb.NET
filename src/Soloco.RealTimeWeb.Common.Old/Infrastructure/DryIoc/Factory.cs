using System;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Base class for different ways to instantiate service: 
    /// <list type="bullet">
    /// <item>Through reflection - <see cref="ReflectionFactory"/></item>
    /// <item>Using custom delegate - <see cref="DelegateFactory"/></item>
    /// <item>Using custom expression - <see cref="ExpressionFactory"/></item>
    /// </list>
    /// For all of the types Factory should provide result as <see cref="Expression"/> and <see cref="FactoryDelegate"/>.
    /// Factories are supposed to be immutable and stateless.
    /// Each created factory has an unique ID set in <see cref="FactoryID"/>.</summary>
    public abstract class Factory
    {
        /// <summary>Unique factory id generated from static seed.</summary>
        public int FactoryID { get; internal set; }

        /// <summary>Reuse policy for factory created services.</summary>
        public readonly IReuse Reuse;

        /// <summary>Setup may contain different/non-default factory settings.</summary>
        public Setup Setup
        {
            get { return _setup; }
            protected internal set { _setup = value ?? Setup.Default; }
        }

        /// <summary>Checks that condition is met for request or there is no condition setup. 
        /// Additionally check for reuse scope availability.</summary>
        /// <param name="request">Request to check against.</param>
        /// <returns>True if condition met or no condition setup.</returns>
        public bool CheckCondition(Request request)
        {
            return (Setup.Condition == null || Setup.Condition(request)) && IsMatchingReuseScope(request);
        }

        /// <summary>Shortcut for <see cref="DryIoc.Setup.FactoryType"/>.</summary>
        public FactoryType FactoryType
        {
            get { return Setup.FactoryType; }
        }

        /// <summary>Non-abstract closed implementation type. May be null if not known beforehand, e.g. in <see cref="DelegateFactory"/>.</summary>
        public virtual Type ImplementationType { get { return null; } }

        /// <summary>Indicates that Factory is factory provider and 
        /// consumer should call <see cref="IConcreteFactoryGenerator.GenerateFactoryOrDefault"/>  to get concrete factory.</summary>
        public virtual IConcreteFactoryGenerator FactoryGenerator { get { return null; } }

        /// <summary>Marks generated factory and identifies the generator id. 
        /// Value -1 indicates that factory is not generated.</summary>
        public virtual int GeneratorFactoryID { get { return -1; } }

        /// <summary>Get next factory ID in a atomic way.</summary><returns>The ID.</returns>
        public static int GetNextID()
        {
            return Interlocked.Increment(ref _lastFactoryID);
        }

        /// <summary>Initializes reuse and setup. Sets the <see cref="FactoryID"/></summary>
        /// <param name="reuse">(optional)</param>
        /// <param name="setup">(optional)</param>
        protected Factory(IReuse reuse = null, Setup setup = null)
        {
            FactoryID = GetNextID();
            Reuse = reuse;
            Setup = setup ?? Setup.Default;
        }

        /// <summary>Returns true if for factory Reuse exists matching resolution or current Scope.</summary>
        /// <param name="request"></param> <returns>True if matching Scope exists.</returns>
        public bool IsMatchingReuseScope(Request request)
        {
            var rules = request.Container.Rules;
            if (!rules.ImplicitCheckForReuseMatchingScope)
                return true;

            var reuseMapping = rules.ReuseMapping;
            var reuse = reuseMapping == null ? Reuse : reuseMapping(Reuse, request);

            if (reuse is ResolutionScopeReuse)
                return reuse.GetScopeOrDefault(request) != null;

            if (reuse is CurrentScopeReuse)
                return request.Parent.Enumerate().Any(r => WrappersSupport.IsFunc(r.ServiceType))
                       || reuse.GetScopeOrDefault(request) != null;

            return true;
        }

        /// <summary>Validates that factory is OK for registered service type.</summary>
        /// <param name="container">Container to register factory in.</param>
        /// <param name="serviceType">Service type to register factory for.</param>
        /// <param name="serviceKey">Service key to register factory with.</param>
        /// <param name="isStaticallyChecked">Skips service type check. Means that service and implementation are statically checked.</param>
        public virtual void ThrowIfInvalidRegistration(IContainer container, Type serviceType, object serviceKey, bool isStaticallyChecked)
        {
            if (!isStaticallyChecked)
                if (serviceType.IsGenericDefinition() && FactoryGenerator == null)
                    Throw.It(Error.RegisteringOpenGenericRequiresFactoryProvider, serviceType);

            if (Setup.FactoryType == FactoryType.Wrapper)
            {
                if (serviceType.IsGeneric())
                {
                    if (((Setup.WrapperSetup)Setup).AlwaysWrapsRequiredServiceType == false)
                    {
                        var typeArgIndex = ((Setup.WrapperSetup)Setup).WrappedServiceTypeArgIndex;
                        var typeArgCount = serviceType.GetGenericParamsAndArgs().Length;
                        Throw.If(typeArgCount > 1 && typeArgIndex == -1,
                            Error.GenericWrapperWithMultipleTypeArgsShouldSpecifyArgIndex, serviceType);
                        var index = typeArgIndex != -1 ? typeArgIndex : 0;
                        Throw.If(index > typeArgCount - 1,
                            Error.GenericWrapperTypeArgIndexOutOfBounds, serviceType, index);
                    }
                }
            }
        }

        /// <summary>The main factory method to create service expression, e.g. "new Client(new Service())".
        /// If <paramref name="request"/> has <see cref="Request.FuncArgs"/> specified, they could be used in expression.</summary>
        /// <param name="request">Service request.</param>
        /// <returns>Created expression.</returns>
        public abstract Expression CreateExpressionOrDefault(Request request);

        /// <summary>Returns service expression: either by creating it with <see cref="CreateExpressionOrDefault"/> or taking expression from cache.
        /// Before returning method may transform the expression  by applying <see cref="Reuse"/>, or/and decorators if found any.</summary>
        /// <param name="request">Request for service.</param>
        /// <returns>Service expression.</returns>
        public virtual Expression GetExpressionOrDefault(Request request)
        {
            // Returns "r.Resolver.Resolve<IDependency>(...)" instead of "new Dependency()".
            if (Setup.AsResolutionRoot && !request.ParentNonWrapper().IsEmpty)
                return Resolver.CreateResolutionExpression(request, Setup.OpenResolutionScope);

            request = request.WithResolvedFactory(this);

            var reuseMappingRule = request.Container.Rules.ReuseMapping;
            var reuse = reuseMappingRule == null ? Reuse : reuseMappingRule(Reuse, request);
            ThrowIfReuseHasShorterLifespanThanParent(reuse, request);

            // Here's lookup for decorators
            var decoratorExpr = FactoryType == FactoryType.Service
                ? request.Container.GetDecoratorExpressionOrDefault(request)
                : null;
            var isReplacingDecorator = decoratorExpr != null && !(decoratorExpr is LambdaExpression);

            var isCacheable = Setup.CacheFactoryExpression && !isReplacingDecorator && request.FuncArgs == null;
            if (isCacheable)
            {
                var cachedServiceExpr = request.Container.GetCachedFactoryExpressionOrDefault(FactoryID);
                if (cachedServiceExpr != null)
                    return decoratorExpr == null ? cachedServiceExpr : Expression.Invoke(decoratorExpr, cachedServiceExpr);
            }

            var serviceExpr = isReplacingDecorator ? decoratorExpr : CreateExpressionOrDefault(request);
            if (serviceExpr != null && reuse != null && !isReplacingDecorator)
            {
                // The singleton optimization: eagerly create singleton and put it into state for fast access.
                if (reuse is SingletonReuse &&
                    FactoryType == FactoryType.Service && request.Container.Rules.SingletonOptimization &&
                    (request.Parent.IsEmpty || !request.Parent.Enumerate().Any(r => r.ServiceType.IsFunc())))
                    serviceExpr = CreateSingletonAndGetExpressionOrDefault(serviceExpr, request);
                else
                    serviceExpr = GetScopedExpressionOrDefault(serviceExpr, reuse, request);
            }

            if (serviceExpr != null)
            {
                if (isCacheable)
                    request.Container.CacheFactoryExpression(FactoryID, serviceExpr);

                if (!isReplacingDecorator && decoratorExpr != null)
                    serviceExpr = Expression.Invoke(decoratorExpr, serviceExpr);
            }

            if (serviceExpr == null && request.IfUnresolved == IfUnresolved.Throw)
                Container.ThrowUnableToResolve(request);

            return serviceExpr;
        }

        /// <summary>Check method name for explanation XD.</summary> <param name="reuse">Reuse to check.</param> <param name="request">Request to resolve.</param>
        protected static void ThrowIfReuseHasShorterLifespanThanParent(IReuse reuse, Request request)
        {
            if (reuse != null && reuse.Lifespan > 0 && !request.Parent.IsEmpty &&
                request.Container.Rules.ThrowIfDependencyHasShorterReuseLifespan)
            {
                var parentReuse = request.Parent.ResolvedFactory.Reuse;
                if (parentReuse != null)
                    Throw.If(reuse.Lifespan < parentReuse.Lifespan,
                        Error.DependencyHasShorterReuseLifespan, request.PrintCurrent(), request.Parent, reuse, parentReuse);
            }
        }

        /// <summary>Creates factory delegate from service expression and returns it.
        /// to compile delegate from expression but could be overridden by concrete factory type: e.g. <see cref="DelegateFactory"/></summary>
        /// <param name="request">Service request.</param>
        /// <returns>Factory delegate created from service expression.</returns>
        public virtual FactoryDelegate GetDelegateOrDefault(Request request)
        {
            var expression = GetExpressionOrDefault(request);
            return expression == null ? null : expression.CompileToDelegate(request.Container.Rules);
        }

        /// <summary>Returns nice string representation of factory.</summary>
        /// <returns>String representation.</returns>
        public override string ToString()
        {
            var s = new StringBuilder().Append("{ID=").Append(FactoryID);
            if (ImplementationType != null)
                s.Append(", ImplType=").Print(ImplementationType);
            if (Reuse != null)
                s.Append(", Reuse=").Print(Reuse);
            if (Setup.FactoryType != Setup.Default.FactoryType)
                s.Append(", FactoryType=").Append(Setup.FactoryType);
            if (Setup.Metadata != null)
                s.Append(", Metadata=").Append(Setup.Metadata);
            if (Setup.Condition != null && Setup.Condition != IsMatchingReuseScope)
                s.Append(", HasCondition");
            if (Setup.OpenResolutionScope)
                s.Append(", OpensResolutionScope");
            return s.Append("}").ToString();
        }

        #region Implementation

        private static int _lastFactoryID;
        private Setup _setup;

        // Example: The result for weak reference would be: 
        // ((WeakReference)scope.GetOrAdd(id, () => new WeakReference(new Service()))).Target.ThrowIfNull(Error.Blah)
        private Expression GetScopedExpressionOrDefault(Expression serviceExpr, IReuse reuse, Request request)
        {
            var getScopeExpr = reuse.GetScopeExpression(request);
            var serviceType = serviceExpr.Type;
            var scopedInstanceId = reuse.GetScopedItemIdOrSelf(FactoryID, request);
            var scopedInstanceIdExpr = Expression.Constant(scopedInstanceId);

            if (Setup.PreventDisposal == false && Setup.WeaklyReferenced == false)
                return Expression.Convert(
                    Expression.Call(getScopeExpr, "GetOrAdd", ArrayTools.Empty<Type>(), scopedInstanceIdExpr,
                        Expression.Lambda<CreateScopedValue>(serviceExpr, ArrayTools.Empty<ParameterExpression>())), serviceType);

            if (Setup.PreventDisposal)
                serviceExpr = Expression.NewArrayInit(typeof(object), serviceExpr);

            if (Setup.WeaklyReferenced)
                serviceExpr = Expression.New(typeof(WeakReference).GetConstructorOrNull(args: typeof(object)), serviceExpr);

            Expression getScopedServiceExpr = Expression.Call(getScopeExpr, "GetOrAdd", ArrayTools.Empty<Type>(),
                scopedInstanceIdExpr, Expression.Lambda<CreateScopedValue>(serviceExpr, ArrayTools.Empty<ParameterExpression>()));

            if (Setup.WeaklyReferenced)
            {
                var weakRefExpr = Expression.Convert(getScopedServiceExpr, typeof(WeakReference));
                var weakRefTargetExpr = Expression.Property(weakRefExpr, "Target");
                var throwIfTargetNullExpr = Expression.Call(typeof(ThrowInGeneratedCode), "ThrowNewErrorIfNull", ArrayTools.Empty<Type>(),
                    weakRefTargetExpr, Expression.Constant(Error.Messages[Error.WeakRefReuseWrapperGCed]));
                getScopedServiceExpr = throwIfTargetNullExpr;
            }

            if (Setup.PreventDisposal)
                getScopedServiceExpr = Expression.ArrayIndex(
                    Expression.Convert(getScopedServiceExpr, typeof(object[])),
                    Expression.Constant(0, typeof(int)));

            return Expression.Convert(getScopedServiceExpr, serviceType);
        }

        private Expression CreateSingletonAndGetExpressionOrDefault(Expression serviceExpr, Request request)
        {
            var factoryDelegate = serviceExpr.CompileToDelegate(request.Container.Rules);
            var scope = request.Scopes.SingletonScope;
            var scopedInstanceId = scope.GetScopedItemIdOrSelf(FactoryID);

            if (Setup.PreventDisposal)
            {
                var serviceFactory = factoryDelegate;
                factoryDelegate = (st, cs, rs) => new[] { serviceFactory(st, cs, rs) };
            }

            if (Setup.WeaklyReferenced)
            {
                var serviceFactory = factoryDelegate;
                factoryDelegate = (st, cs, rs) => new WeakReference(serviceFactory(st, cs, rs));
            }

            var serviceType = serviceExpr.Type;
            if (Setup.PreventDisposal == false && Setup.WeaklyReferenced == false)
                return request.Container.GetOrAddStateItemExpression(
                    scope.GetOrAdd(scopedInstanceId, 
                        () => factoryDelegate(request.Container.ResolutionStateCache, request.ContainerWeakRef, request.Scope)),
                    serviceType);

            var wrappedService = scope.GetOrAdd(scopedInstanceId,
                () => factoryDelegate(request.Container.ResolutionStateCache, request.ContainerWeakRef, null));

            if (Setup.WeaklyReferenced)
                wrappedService = ((WeakReference)wrappedService).Target.ThrowIfNull(Error.WeakRefReuseWrapperGCed);

            if (Setup.PreventDisposal)
                wrappedService = ((object[])wrappedService)[0];

            return request.Container.GetOrAddStateItemExpression(wrappedService, serviceType);
        }

        #endregion
    }
}