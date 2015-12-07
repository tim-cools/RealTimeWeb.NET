using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Soloco.RealTimeWeb.Common.Infrastructure.DryIoc
{
    /// <summary>Adds to Container support for:
    /// <list type="bullet">
    /// <item>Open-generic services</item>
    /// <item>Service generics wrappers and arrays using <see cref="Rules.UnknownServiceResolvers"/> extension point.
    /// Supported wrappers include: Func of <see cref="FuncTypes"/>, Lazy, Many, IEnumerable, arrays, Meta, KeyValuePair, DebugExpression.
    /// All wrapper factories are added into collection <see cref="Wrappers"/> and searched by <see cref="ResolveWrappers"/>
    /// unregistered resolution rule.</item>
    /// </list></summary>
    public static class WrappersSupport
    {
        /// <summary>Supported Func types up to 4 input parameters.</summary>
        public static readonly Type[] FuncTypes = { typeof(Func<>), typeof(Func<,>), typeof(Func<,,>), typeof(Func<,,,>), typeof(Func<,,,,>) };

        /// <summary>Registered wrappers by their concrete or generic definition service type.</summary>
        public static readonly ImTreeMap<Type, Factory> Wrappers;

        static WrappersSupport()
        {
            Wrappers = ImTreeMap<Type, Factory>.Empty;

            // Register array and its collection/list interfaces.
            var arrayExpr = new ExpressionFactory(GetArrayExpression, setup: Setup.Wrapper);

            var arrayInterfaces = typeof(object[]).GetImplementedInterfaces()
                .Where(t => t.IsGeneric()).Select(t => t.GetGenericTypeDefinition());

            foreach (var arrayInterface in arrayInterfaces)
                Wrappers = Wrappers.AddOrUpdate(arrayInterface, arrayExpr);

            Wrappers = Wrappers.AddOrUpdate(typeof(LazyEnumerable<>),
                new ExpressionFactory(GetLazyEnumerableExpressionOrDefault, setup: Setup.Wrapper));

            Wrappers = Wrappers.AddOrUpdate(typeof(Lazy<>),
                new ExpressionFactory(GetLazyExpressionOrDefault, setup: Setup.Wrapper));

            Wrappers = Wrappers.AddOrUpdate(typeof(KeyValuePair<,>),
                new ExpressionFactory(GetKeyValuePairExpressionOrDefault, setup: Setup.WrapperWith(1)));

            Wrappers = Wrappers.AddOrUpdate(typeof(Meta<,>),
                new ExpressionFactory(GetMetaExpressionOrDefault, setup: Setup.WrapperWith(0)));

            Wrappers = Wrappers.AddOrUpdate(typeof(Tuple<,>),
                new ExpressionFactory(GetMetaExpressionOrDefault, setup: Setup.WrapperWith(0)));

            Wrappers = Wrappers.AddOrUpdate(typeof(LambdaExpression),
                new ExpressionFactory(GetLambdaExpressionExpressionOrDefault, setup: Setup.Wrapper));

            Wrappers = Wrappers.AddOrUpdate(typeof(Func<>),
                new ExpressionFactory(GetFuncExpressionOrDefault, setup: Setup.Wrapper));

            for (var i = 0; i < FuncTypes.Length; i++)
                Wrappers = Wrappers.AddOrUpdate(FuncTypes[i],
                    new ExpressionFactory(GetFuncExpressionOrDefault, setup: Setup.WrapperWith(i)));
        }

        /// <summary>Unregistered/fallback wrapper resolution rule.</summary>
        public static readonly Rules.UnknownServiceResolver ResolveWrappers = request =>
        {
            var serviceType = request.ServiceType;
            var itemType = serviceType.GetArrayElementTypeOrNull();
            if (itemType != null)
                serviceType = typeof(IEnumerable<>).MakeGenericType(itemType);

            var factory = request.Container.GetWrapperFactoryOrDefault(serviceType);
            if (factory != null && factory.FactoryGenerator != null)
                factory = factory.FactoryGenerator.GenerateFactoryOrDefault(request);

            return factory;
        };

        /// <summary>Checks if request has parent with service type of Func with arguments. 
        /// Often required to check in lazy scenarios.</summary>
        /// <param name="request">Request too check.</param>
        /// <returns>True if has Func parent.</returns>
        public static bool IsNestedInFuncWithArgs(this Request request)
        {
            return !request.Parent.IsEmpty && request.Parent.Enumerate()
                .TakeWhile(r => r.ResolvedFactory.FactoryType == FactoryType.Wrapper)
                .Any(r => r.ServiceType.IsFuncWithArgs());
        }

        private static Expression GetArrayExpression(Request request)
        {
            var collectionType = request.ServiceType;
            var container = request.Container;
            var rules = container.Rules;

            if (rules.ResolveIEnumerableAsLazyEnumerable &&
                collectionType.GetGenericDefinitionOrNull() == typeof(IEnumerable<>))
                return GetLazyEnumerableExpressionOrDefault(request);

            var itemType = collectionType.GetArrayElementTypeOrNull() ?? collectionType.GetGenericParamsAndArgs()[0];

            var requiredItemType = container.GetWrappedType(itemType, request.RequiredServiceType);

            var items = container.GetAllServiceFactories(requiredItemType)
                .Select(kv => new ServiceRegistrationInfo(kv.Value, null, kv.Key))
                .ToArray();

            if (requiredItemType.IsClosedGeneric())
            {
                var requiredItemGenericDefinition = requiredItemType.GetGenericDefinitionOrNull();
                var openGenericItems = container.GetAllServiceFactories(requiredItemGenericDefinition)
                    .Where(ogi => items.All(i => i.Factory.GeneratorFactoryID != ogi.Value.FactoryID))
                    .Select(kv => new ServiceRegistrationInfo(kv.Value, requiredItemGenericDefinition, kv.Key))
                    .ToArray();
                items = items.Append(openGenericItems);
            }

            // Append registered generic types with compatible variance, 
            // e.g. for IHandler<in E> - IHandler<A> is compatible with IHandler<B> if B : A.
            var includeVariantGenericItems = requiredItemType.IsGeneric() && rules.VariantGenericTypesInResolvedCollection;
            if (includeVariantGenericItems)
            {
                var variantGenericItems = container.GetServiceRegistrations()
                    .Where(x =>
                        x.ServiceType.IsGeneric() &&
                        x.ServiceType.GetGenericTypeDefinition() == requiredItemType.GetGenericTypeDefinition() &&
                        x.ServiceType != requiredItemType &&
                        x.ServiceType.IsAssignableTo(requiredItemType))
                    .ToArray();
                items = items.Append(variantGenericItems);
            }

            // Composite pattern support: filter out composite root from available keys.
            var parent = request.ParentNonWrapper();
            if (!parent.IsEmpty && parent.ServiceType == requiredItemType)
            {
                var parentFactoryID = parent.ResolvedFactory.FactoryID;
                items = items
                    .Where(x => x.Factory.FactoryID != parentFactoryID)
                    .ToArray();
            }

            // Return collection of single matched item if key is specified.
            if (request.ServiceKey != null)
                items = items.Where(x => request.ServiceKey.Equals(x.OptionalServiceKey)).ToArray();

            List<Expression> itemExprList = null;
            if (!items.IsNullOrEmpty())
            {
                itemExprList = new List<Expression>(items.Length);
                for (var i = 0; i < items.Length; i++)
                {
                    var item = items[i];
                    var itemRequest = request.Push(itemType, item.OptionalServiceKey, IfUnresolved.ReturnDefault, item.ServiceType);
                    var itemFactory = container.ResolveFactory(itemRequest);
                    if (itemFactory != null)
                    {
                        var itemExpr = itemFactory.GetExpressionOrDefault(itemRequest);
                        if (itemExpr != null)
                            itemExprList.Add(itemExpr);
                    }
                }
            }

            return Expression.NewArrayInit(itemType.ThrowIfNull(), itemExprList ?? Enumerable.Empty<Expression>());
        }

        private static readonly MethodInfo _resolveManyMethod =
            typeof(IResolver).GetSingleMethodOrNull("ResolveMany").ThrowIfNull();

        private static Expression GetLazyEnumerableExpressionOrDefault(Request request)
        {
            if (IsNestedInFuncWithArgs(request))
                return null;

            var itemServiceType = request.ServiceType.GetGenericParamsAndArgs()[0];
            var itemRequiredServiceType = request.Container.GetWrappedType(itemServiceType, request.RequiredServiceType);

            // Composite pattern support: find composite parent key to exclude from result.
            object compositeParentKey = null;
            var parent = request.ParentNonWrapper();
            if (!parent.IsEmpty && parent.ServiceType == itemRequiredServiceType)
                compositeParentKey = parent.ServiceKey;

            var callResolveManyExpr = Expression.Call(Container.ResolverExpr, _resolveManyMethod,
                Expression.Constant(itemServiceType),
                request.Container.GetOrAddStateItemExpression(request.ServiceKey),
                Expression.Constant(itemRequiredServiceType),
                request.Container.GetOrAddStateItemExpression(compositeParentKey),
                Container.GetResolutionScopeExpression(request));

            if (itemServiceType != typeof(object)) // cast to object is not required cause Resolve already return IEnumerable<object>
                callResolveManyExpr = Expression.Call(typeof(Enumerable), "Cast", new[] { itemServiceType }, callResolveManyExpr);

            var lazyEnumerableCtor = typeof(LazyEnumerable<>).MakeGenericType(itemServiceType).GetSingleConstructorOrNull();
            return Expression.New(lazyEnumerableCtor, callResolveManyExpr);
        }

        // Result: r => new Lazy<TService>(() => r.Resolver.Resolve<TService>(key, ifUnresolved, requiredType));
        private static Expression GetLazyExpressionOrDefault(Request request)
        {
            if (IsNestedInFuncWithArgs(request))
                return null;

            var wrapperType = request.ServiceType;
            var serviceType = wrapperType.GetGenericParamsAndArgs()[0];
            var serviceExpr = Resolver.CreateResolutionExpression(request, serviceType: serviceType);
            var factoryExpr = Expression.Lambda(serviceExpr, null);
            var wrapperCtor = wrapperType.GetConstructorOrNull(args: typeof(Func<>).MakeGenericType(serviceType));
            return Expression.New(wrapperCtor, factoryExpr);
        }

        private static Expression GetFuncExpressionOrDefault(Request request)
        {
            var funcType = request.ServiceType;
            var funcArgs = funcType.GetGenericParamsAndArgs();
            var serviceType = funcArgs[funcArgs.Length - 1];

            ParameterExpression[] funcArgExprs = null;
            if (funcArgs.Length > 1)
            {
                request = request.WithFuncArgs(funcType);
                funcArgExprs = request.FuncArgs.Value;
            }

            var serviceRequest = request.Push(serviceType);
            var serviceFactory = request.Container.ResolveFactory(serviceRequest);
            var serviceExpr = serviceFactory == null ? null : serviceFactory.GetExpressionOrDefault(serviceRequest);
            return serviceExpr == null ? null : Expression.Lambda(funcType, serviceExpr, funcArgExprs);
        }

        private static Expression GetLambdaExpressionExpressionOrDefault(Request request)
        {
            var serviceType = request.RequiredServiceType
                .ThrowIfNull(Error.ResolutionNeedsRequiredServiceType, request);
            var serviceRequest = request.Push(serviceType);
            var factory = request.Container.ResolveFactory(serviceRequest);
            var expr = factory == null ? null : factory.GetExpressionOrDefault(serviceRequest);
            return expr == null ? null : Expression.Constant(expr.WrapInFactoryExpression(), typeof(LambdaExpression));
        }

        private static Expression GetKeyValuePairExpressionOrDefault(Request request)
        {
            var typeArgs = request.ServiceType.GetGenericParamsAndArgs();
            var serviceKeyType = typeArgs[0];
            var serviceKey = request.ServiceKey;
            if (serviceKey == null && serviceKeyType.IsValueType() ||
                serviceKey != null && !serviceKeyType.IsTypeOf(serviceKey))
                return null;

            var serviceType = typeArgs[1];
            var serviceRequest = request.Push(serviceType, serviceKey);
            var serviceFactory = request.Container.ResolveFactory(serviceRequest);
            var serviceExpr = serviceFactory == null ? null : serviceFactory.GetExpressionOrDefault(serviceRequest);
            if (serviceExpr == null)
                return null;

            var pairCtor = request.ServiceType.GetSingleConstructorOrNull().ThrowIfNull();
            var keyExpr = request.Container.GetOrAddStateItemExpression(serviceKey, serviceKeyType);
            var pairExpr = Expression.New(pairCtor, keyExpr, serviceExpr);
            return pairExpr;
        }

        /// <remarks>If service key is not specified in request then method will search for all
        /// registered factories with the same metadata type ignoring keys.</remarks>
        private static Expression GetMetaExpressionOrDefault(Request request)
        {
            var typeArgs = request.ServiceType.GetGenericParamsAndArgs();
            var metadataType = typeArgs[1];
            var serviceType = typeArgs[0];

            var container = request.Container;
            var requiredServiceType = container.GetWrappedType(serviceType, request.RequiredServiceType);
            var serviceKey = request.ServiceKey;

            var result = container.GetAllServiceFactories(requiredServiceType, bothClosedAndOpenGenerics: true)
                .FirstOrDefault(f => (serviceKey == null || f.Key.Equals(serviceKey))
                                     && f.Value.Setup.Metadata != null && metadataType.IsTypeOf(f.Value.Setup.Metadata));

            if (result == null)
                return null;

            serviceKey = result.Key;

            var serviceRequest = request.Push(serviceType, serviceKey);
            var serviceFactory = container.ResolveFactory(serviceRequest);
            var serviceExpr = serviceFactory == null ? null : serviceFactory.GetExpressionOrDefault(serviceRequest);
            if (serviceExpr == null)
                return null;

            var metaCtor = request.ServiceType.GetSingleConstructorOrNull().ThrowIfNull();
            var metadataExpr = request.Container.GetOrAddStateItemExpression(result.Value.Setup.Metadata, metadataType);
            var metaExpr = Expression.New(metaCtor, serviceExpr, metadataExpr);
            return metaExpr;
        }

        /// <summary>Returns true if type is supported <see cref="FuncTypes"/>, and false otherwise.</summary>
        /// <param name="type">Type to check.</param><returns>True for func type, false otherwise.</returns>
        public static bool IsFunc(this Type type)
        {
            var genericDefinition = type.GetGenericDefinitionOrNull();
            return genericDefinition != null && FuncTypes.Contains(genericDefinition);
        }

        /// <summary>Returns true if type is func with 1 or more input arguments.</summary>
        /// <param name="type">Type to check.</param><returns>True for func type, false otherwise.</returns>
        public static bool IsFuncWithArgs(this Type type)
        {
            return type.IsFunc() && type.GetGenericTypeDefinition() != typeof(Func<>);
        }
    }
}