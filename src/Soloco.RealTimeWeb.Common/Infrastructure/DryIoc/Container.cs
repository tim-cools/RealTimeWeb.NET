/*
The MIT License (MIT)

Copyright (c) 2013 Maksim Volkau

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included AddOrUpdateServiceFactory
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.Linq;
    using System.Linq.Expressions;
    using System.Reflection;
    using System.Text;
    using System.Threading;

    /// <summary>IoC Container. Documentation is available at https://bitbucket.org/dadhi/dryioc. </summary>
    public sealed partial class Container : IContainer, IScopeAccess
    {
        /// <summary>Creates new container, optionally providing <see cref="Rules"/> to modify default container behavior.</summary>
        /// <param name="rules">(optional) Rules to modify container default resolution behavior. 
        /// If not specified, then <see cref="DryIoc.Rules.Default"/> will be used.</param>
        /// <param name="scopeContext">(optional) Scope context to use for <see cref="Reuse.InCurrentScope"/>, default is <see cref="ThreadScopeContext"/>.</param>
        public Container(Rules rules = null, IScopeContext scopeContext = null)
            : this(rules ?? Rules.Default, Ref.Of(Registry.Default), new SingletonScope(), scopeContext)
        { }

        /// <summary>Creates new container with configured rules.</summary>
        /// <param name="configure">Delegate gets <see cref="DryIoc.Rules.Default"/> as input and may return configured rules.</param>
        /// <param name="scopeContext">(optional) Scope context to use for <see cref="Reuse.InCurrentScope"/>, default is <see cref="ThreadScopeContext"/>.</param>
        public Container(Func<Rules, Rules> configure, IScopeContext scopeContext = null)
            : this(configure.ThrowIfNull()(Rules.Default) ?? Rules.Default, scopeContext)
        { }

        /// <summary>Shares all of container state except Cache and specifies new rules.</summary>
        /// <param name="configure">(optional) Configure rules, if not specified then uses Rules from current container.</param> 
        /// <param name="scopeContext">(optional) New scope context, if not specified then uses context from current container.</param>
        /// <returns>New container.</returns>
        public IContainer With(Func<Rules, Rules> configure = null, IScopeContext scopeContext = null)
        {
            ThrowIfContainerDisposed();
            var rules = configure == null ? Rules : configure(Rules);
            scopeContext = scopeContext ?? _scopeContext;
            if (rules == Rules && scopeContext == _scopeContext)
                return this;
            var registryWithoutCache = Ref.Of(_registry.Value.WithoutCache());
            return new Container(rules, registryWithoutCache, _singletonScope, scopeContext, _openedScope, _disposed);
        }

        /// <summary>Returns new container with all expression, delegate, items cache removed/reset.
        /// It will preserve resolved services in Singleton/Current scope.</summary>
        /// <returns>New container with empty cache.</returns>
        public IContainer WithoutCache()
        {
            ThrowIfContainerDisposed();
            var registryWithoutCache = Ref.Of(_registry.Value.WithoutCache());
            return new Container(Rules, registryWithoutCache, _singletonScope, _scopeContext, _openedScope, _disposed);
        }

        /// <summary>Creates new container with state shared with original except singletons and cache.
        /// Dropping cache is required because singletons are cached in resolution state.</summary>
        /// <returns>New container with empty Singleton Scope.</returns>
        public IContainer WithoutSingletonsAndCache()
        {
            ThrowIfContainerDisposed();
            var registryWithoutCache = Ref.Of(_registry.Value.WithoutCache());
            var newSingletons = new Scope();
            return new Container(Rules, registryWithoutCache, newSingletons, _scopeContext, _openedScope, _disposed);
        }

        /// <summary>Shares all parts with original container But copies registration, so the new registration
        /// won't be visible in original. Registrations include decorators and wrappers as well.</summary>
        /// <param name="preserveCache">(optional) If set preserves cache if you know what to do.</param>
        /// <returns>New container with copy of all registrations.</returns>
        public IContainer WithRegistrationsCopy(bool preserveCache = false)
        {
            ThrowIfContainerDisposed();
            var newRegistry = preserveCache ? _registry.NewRef() : Ref.Of(_registry.Value.WithoutCache());
            return new Container(Rules, newRegistry, _singletonScope, _scopeContext, _openedScope, _disposed);
        }

        /// <summary>Returns scope context associated with container.</summary>
        public IScopeContext ScopeContext { get { return _scopeContext; } }

        /// <summary>Creates new container with new opened scope and set this scope as current in ambient scope context.</summary>
        /// <param name="scopeName">(optional) Name for opened scope to allow reuse to identify the scope.</param>
        /// <param name="configure">(optional) Configure rules, if not specified then uses Rules from current container.</param> 
        /// <returns>New container with different current scope and optionally Rules.</returns>
        /// <example><code lang="cs"><![CDATA[
        /// using (var scoped = container.OpenScope())
        /// {
        ///     var handler = scoped.Resolve<IHandler>();
        ///     handler.Handle(data);
        /// }
        /// ]]></code></example>
        /// <remarks>Be sure to Dispose returned scope, because if not - ambient context will keep scope with it's items
        /// introducing memory leaks and likely preventing to open other scopes.</remarks>
        public IContainer OpenScope(object scopeName = null, Func<Rules, Rules> configure = null)
        {
            ThrowIfContainerDisposed();

            if (scopeName == null)
                scopeName = _openedScope != null ? null
                    : _scopeContext != null ? _scopeContext.RootScopeName
                    : NonAmbientRootScopeName;

            var nestedOpenedScope = new Scope(_openedScope, scopeName);

            // Replacing current context scope with new nested only if current is the same as nested parent, otherwise throw.
            if (_scopeContext != null)
                _scopeContext.SetCurrent(scope =>
                     nestedOpenedScope.ThrowIf(scope != _openedScope, Error.NotDirectScopeParent, _openedScope, scope));

            var rules = configure == null ? Rules : configure(Rules);
            return new Container(rules, _registry, _singletonScope, _scopeContext, nestedOpenedScope, _disposed);
        }

        /// <summary>Provides root scope name when context is absent.</summary>
        public static readonly object NonAmbientRootScopeName = typeof(IContainer).FullName;

        /// <summary>Creates container (facade) that fallbacks to this container for unresolved services.
        /// Facade is the new empty container, with the same rules and scope context as current container. 
        /// It could be used for instance to create Test facade over original container with replacing some services with test ones.</summary>
        /// <remarks>Singletons from container are not reused by facade - when you resolve singleton directly from parent and then ask for it from child, it will return another object.
        /// To achieve that you may use <see cref="IContainer.OpenScope"/> with <see cref="Reuse.InCurrentScope"/>.</remarks>
        /// <returns>New facade container.</returns>
        public IContainer CreateFacade()
        {
            ThrowIfContainerDisposed();
            return new Container(Rules.WithFallbackContainer(this), _scopeContext);
        }

        /// <summary>Disposes container current scope and that means container itself.</summary>
        public void Dispose()
        {
            if (Interlocked.CompareExchange(ref _disposed, 1, 0) != 0)
                return;

            if (_openedScope != null) // for container created with Open(Bound)Scope
            {
                if (_scopeContext != null)
                {
                    // try to revert context to parent scope, otherwise if context and opened scope not in sync - do nothing
                    var openedScope = _openedScope;
                    _scopeContext.SetCurrent(scope => scope == openedScope ? scope.Parent : scope);
                }

                _openedScope.Dispose();
            }
            else // for Container created with constructor.
            {
                Rules = Rules.Empty;
                _registry.Swap(_ => Registry.Empty);
                _singletonScope.Dispose();
                if (_scopeContext != null)
                    _scopeContext.Dispose();
            }
        }

        #region Static state

        internal static readonly ParameterExpression StateParamExpr =
            Expression.Parameter(typeof(object[]), "state");

        internal static readonly ParameterExpression ResolverContextParamExpr =
            Expression.Parameter(typeof(IResolverContext), "r");

        internal static readonly Expression ResolverExpr =
            Expression.Property(ResolverContextParamExpr, "Resolver");

        internal static readonly Expression ScopesExpr =
            Expression.Property(ResolverContextParamExpr, "Scopes");

        internal static readonly ParameterExpression ResolutionScopeParamExpr =
            Expression.Parameter(typeof(IScope), "scope");

        internal static readonly ParameterExpression[] FactoryDelegateParamsExpr = { StateParamExpr, ResolverContextParamExpr, ResolutionScopeParamExpr };

        internal static Expression GetResolutionScopeExpression(Request request)
        {
            if (request.Scope != null)
                return ResolutionScopeParamExpr;

            var container = request.Container;

            var parent = request.Enumerate().Last();

            var registeredServiceType = container.GetWrappedType(parent.ServiceType, parent.RequiredServiceType);
            var parentServiceTypeExpr = container.GetOrAddStateItemExpression(registeredServiceType, typeof(Type));
            var parentServiceKeyExpr = Expression.Convert(container.GetOrAddStateItemExpression(parent.ServiceKey), typeof(object));
            return Expression.Call(ScopesExpr, "GetOrCreateResolutionScope", ArrayTools.Empty<Type>(),
                ResolutionScopeParamExpr, parentServiceTypeExpr, parentServiceKeyExpr);
        }

        #endregion

        #region IRegistrator

        /// <summary>Returns all registered service factories with their Type and optional Key.</summary>
        /// <returns>Existing registrations.</returns>
        /// <remarks>Decorator and Wrapper types are not included.</remarks>
        public IEnumerable<ServiceRegistrationInfo> GetServiceRegistrations()
        {
            return _registry.Value.GetServiceRegistrations();
        }

        /// <summary>Stores factory into container using <paramref name="serviceType"/> and <paramref name="serviceKey"/> as key
        /// for later lookup.</summary>
        /// <param name="factory">Any subtypes of <see cref="Factory"/>.</param>
        /// <param name="serviceType">Type of service to resolve later.</param>
        /// <param name="serviceKey">(optional) Service key of any type with <see cref="object.GetHashCode"/> and <see cref="object.Equals(object)"/>
        /// implemented.</param>
        /// <param name="ifAlreadyRegistered">(optional) Says how to handle existing registration with the same 
        /// <paramref name="serviceType"/> and <paramref name="serviceKey"/>.</param>
        /// <param name="isStaticallyChecked">Confirms that service and implementation types are statically checked by compiler.</param>
        /// <returns>True if factory was added to registry, false otherwise. 
        /// False may be in case of <see cref="IfAlreadyRegistered.Keep"/> setting and already existing factory.</returns>
        public bool Register(Factory factory, Type serviceType, object serviceKey, IfAlreadyRegistered ifAlreadyRegistered, bool isStaticallyChecked)
        {
            ThrowIfContainerDisposed();
            factory.ThrowIfNull().ThrowIfInvalidRegistration(this, serviceType.ThrowIfNull(), serviceKey, isStaticallyChecked);

            var isRegistered = false;
            _registry.Swap(registry =>
            {
                var newRegistry = registry.Register(factory, serviceType, ifAlreadyRegistered, serviceKey);
                isRegistered = newRegistry != registry;
                return newRegistry;
            });
            return isRegistered;
        }

        /// <summary>Returns true if there is registered factory with the service type and key.
        /// To check if only default factory is registered specify <see cref="DefaultKey.Value"/> as <paramref name="serviceKey"/>.
        /// Otherwise, if no <paramref name="serviceKey"/> specified then True will returned for any registered factories, even keyed.
        /// Additionally you can specify <paramref name="condition"/> to be applied to registered factories.</summary>
        /// <param name="serviceType">Service type to look for.</param>
        /// <param name="serviceKey">Service key to look for.</param>
        /// <param name="factoryType">Expected registered factory type.</param>
        /// <param name="condition">Expected factory condition.</param>
        /// <returns>True if factory is registered, false if not.</returns>
        public bool IsRegistered(Type serviceType, object serviceKey, FactoryType factoryType, Func<Factory, bool> condition)
        {
            ThrowIfContainerDisposed();
            return _registry.Value.IsRegistered(serviceType.ThrowIfNull(), serviceKey, factoryType, condition);
        }

        /// <summary>Removes specified factory from registry. 
        /// Factory is removed only from registry, if there is relevant cache, it will be kept.
        /// Use <see cref="WithoutCache"/> to remove all the cache.</summary>
        /// <param name="serviceType">Service type to look for.</param>
        /// <param name="serviceKey">Service key to look for.</param>
        /// <param name="factoryType">Expected factory type.</param>
        /// <param name="condition">Expected factory condition.</param>
        public void Unregister(Type serviceType, object serviceKey, FactoryType factoryType, Func<Factory, bool> condition)
        {
            ThrowIfContainerDisposed();
            _registry.Swap(r => r.Unregister(factoryType, serviceType, serviceKey, condition));
        }

        #endregion

        #region IResolver

        object IResolver.ResolveDefault(Type serviceType, bool ifUnresolvedReturnDefault)
        {
            return _registry.Value.ResolveServiceFromCache(serviceType, _containerWeakRef)
                ?? ResolveAndCacheDefaultDelegate(serviceType, ifUnresolvedReturnDefault, null);
        }

        object IResolver.ResolveKeyed(Type serviceType, object serviceKey, bool ifUnresolvedReturnDefault, Type requiredServiceType, IScope scope)
        {
            if (requiredServiceType != null)
                if (requiredServiceType.IsAssignableTo(serviceType))
                {
                    serviceType = requiredServiceType;
                    requiredServiceType = null;
                }

            if (scope != null)
                scope = new Scope(scope, new KV<Type, object>(serviceType, serviceKey));

            var registry = _registry.Value;

            // If service key is null, then use resolve default instead of keyed.
            if (serviceKey == null && requiredServiceType == null)
            {
                var defaultFactory = registry.DefaultFactoryDelegateCache.Value.GetValueOrDefault(serviceType);
                return defaultFactory != null
                    ? defaultFactory(registry.ResolutionStateCache.Value, _containerWeakRef, scope)
                    : ResolveAndCacheDefaultDelegate(serviceType, ifUnresolvedReturnDefault, scope);
            }

            var keyedCacheKey = new KV<Type, object>(serviceType, serviceKey);
            if (requiredServiceType == null)
            {
                var cachedKeyedFactory = registry.KeyedFactoryDelegateCache.Value.GetValueOrDefault(keyedCacheKey);
                if (cachedKeyedFactory != null)
                    return cachedKeyedFactory(registry.ResolutionStateCache.Value, _containerWeakRef, scope);
            }

            ThrowIfContainerDisposed();

            var ifUnresolved = ifUnresolvedReturnDefault ? IfUnresolved.ReturnDefault : IfUnresolved.Throw;
            var request = _emptyRequest.Push(serviceType, serviceKey, ifUnresolved, requiredServiceType, scope);
            var factory = ((IContainer)this).ResolveFactory(request);
            var keyedFactory = factory == null ? null : factory.GetDelegateOrDefault(request);
            if (keyedFactory == null)
                return null;

            var resultService = keyedFactory(request.Container.ResolutionStateCache, _containerWeakRef, scope);

            // Cache factory only after it is invoked without errors to prevent not-working entries in cache.
            if (factory.Setup.CacheFactoryExpression && requiredServiceType == null)
                registry.KeyedFactoryDelegateCache.Swap(_ => _.AddOrUpdate(keyedCacheKey, keyedFactory));

            return resultService;
        }

        private object ResolveAndCacheDefaultDelegate(Type serviceType, bool ifUnresolvedReturnDefault, IScope scope)
        {
            ThrowIfContainerDisposed();

            var ifUnresolved = ifUnresolvedReturnDefault ? IfUnresolved.ReturnDefault : IfUnresolved.Throw;
            var request = _emptyRequest.Push(serviceType, ifUnresolved: ifUnresolved, scope: scope);
            var factory = ((IContainer)this).ResolveFactory(request); // NOTE may change request

            // The situation is possible for multiple default services registered.
            if (request.ServiceKey != null)
                return ((IResolver)this).ResolveKeyed(serviceType, request.ServiceKey, ifUnresolvedReturnDefault, null, scope);

            var factoryDelegate = factory == null ? null : factory.GetDelegateOrDefault(request);
            if (factoryDelegate == null)
                return null;

            var registry = _registry.Value;
            var service = factoryDelegate(registry.ResolutionStateCache.Value, _containerWeakRef, scope);

            if (factory.Setup.CacheFactoryExpression)
                registry.DefaultFactoryDelegateCache.Swap(_ => _.AddOrUpdate(serviceType, factoryDelegate));

            return service;
        }

        IEnumerable<object> IResolver.ResolveMany(Type serviceType, object serviceKey, Type requiredServiceType, object compositeParentKey, IScope scope)
        {
            var container = ((IContainer)this);
            var itemServiceType = requiredServiceType ?? serviceType;
            var items = container.GetAllServiceFactories(itemServiceType);

            IEnumerable<ServiceRegistrationInfo> openGenericItems = null;
            if (itemServiceType.IsClosedGeneric())
            {
                var serviceGenericDefinition = itemServiceType.GetGenericDefinitionOrNull();
                KV<object, Factory>[] closedGenericItems = null;
                openGenericItems = container.GetAllServiceFactories(serviceGenericDefinition)
                    // Exclude open-generics that already have generated required closed-generic service.
                    .Where(x => (closedGenericItems ?? (closedGenericItems = items.ToArray()))
                        .All(i => i.Value.GeneratorFactoryID != x.Value.FactoryID))
                    .Select(x => new ServiceRegistrationInfo(x.Value, serviceGenericDefinition, x.Key));
            }

            // Append registered generic types with compatible variance, 
            // e.g. for IHandler<in E> - IHandler<A> is compatible with IHandler<B> if B : A.
            IEnumerable<ServiceRegistrationInfo> variantGenericItems = null;
            if (itemServiceType.IsGeneric() && container.Rules.VariantGenericTypesInResolvedCollection)
                variantGenericItems = container.GetServiceRegistrations()
                    .Where(x => x.ServiceType.IsGeneric()
                        && x.ServiceType.GetGenericTypeDefinition() == itemServiceType.GetGenericTypeDefinition()
                        && x.ServiceType != itemServiceType
                        && x.ServiceType.IsAssignableTo(itemServiceType));

            if (serviceKey != null) // include only single item matching key.
            {
                items = items.Where(x => serviceKey.Equals(x.Key));
                if (openGenericItems != null)
                    openGenericItems = openGenericItems.Where(x => serviceKey.Equals(x.OptionalServiceKey));
                if (variantGenericItems != null)
                    variantGenericItems = variantGenericItems.Where(x => serviceKey.Equals(x.OptionalServiceKey));
            }

            if (compositeParentKey != null) // exclude composite parent from items
            {
                items = items.Where(x => !compositeParentKey.Equals(x.Key));
                if (openGenericItems != null)
                    openGenericItems = openGenericItems.Where(x => !compositeParentKey.Equals(x.OptionalServiceKey));
                if (variantGenericItems != null)
                    variantGenericItems = variantGenericItems.Where(x => !compositeParentKey.Equals(x.OptionalServiceKey));
            }

            foreach (var item in items)
            {
                var service = ((IResolver)this).ResolveKeyed(serviceType, item.Key, true, requiredServiceType, scope);
                if (service != null) // skip unresolved items
                    yield return service;
            }

            if (openGenericItems != null)
                foreach (var item in openGenericItems)
                {
                    var service = ((IResolver)this).ResolveKeyed(serviceType, item.OptionalServiceKey, true, item.ServiceType, scope);
                    if (service != null) // skip unresolved items
                        yield return service;
                }

            if (variantGenericItems != null)
                foreach (var item in variantGenericItems)
                {
                    var service = ((IResolver)this).ResolveKeyed(serviceType, item.OptionalServiceKey, true, item.ServiceType, scope);
                    if (service != null) // skip unresolved items
                        yield return service;
                }
        }

        private void ThrowIfContainerDisposed()
        {
            if (IsDisposed)
                Throw.It(Error.ContainerIsDisposed);
        }

        #endregion

        #region IResolverContext

        /// <summary>Scope containing container singletons.</summary>
        IScope IScopeAccess.SingletonScope
        {
            get { return _singletonScope; }
        }

        IScope IScopeAccess.GetCurrentScope()
        {
            return ((IScopeAccess)this).GetCurrentNamedScope(null, false);
        }

        /// <summary>Gets current scope matching the <paramref name="name"/>. 
        /// If name is null then current scope is returned, or if there is no current scope then exception thrown.</summary>
        /// <param name="name">May be null</param> <param name="throwIfNotFound">Says to throw if no scope found.</param>
        /// <returns>Found scope or throws exception.</returns>
        /// <exception cref="ContainerException"> with code <see cref="Error.NoMatchedScopeFound"/>.</exception>
        IScope IScopeAccess.GetCurrentNamedScope(object name, bool throwIfNotFound)
        {
            var currentScope = _scopeContext == null ? _openedScope : _scopeContext.GetCurrentOrDefault();
            return currentScope == null
                ? (throwIfNotFound ? Throw.For<IScope>(Error.NoCurrentScope) : null)
                : GetMatchingScopeOrDefault(currentScope, name)
                ?? (throwIfNotFound ? Throw.For<IScope>(Error.NoMatchedScopeFound, name) : null);
        }

        private static IScope GetMatchingScopeOrDefault(IScope scope, object name)
        {
            if (name != null)
                while (scope != null && !name.Equals(scope.Name))
                    scope = scope.Parent;
            return scope;
        }

        /// <summary>Check if scope is not null, then just returns it, otherwise will create and return it.</summary>
        /// <param name="scope">May be null scope.</param>
        /// <param name="serviceType">Marking scope with resolved service type.</param> 
        /// <param name="serviceKey">Marking scope with resolved service key.</param>
        /// <returns>Input <paramref name="scope"/> ensuring it is not null.</returns>
        IScope IScopeAccess.GetOrCreateResolutionScope(ref IScope scope, Type serviceType, object serviceKey)
        {
            return scope ?? (scope = new Scope(null, new KV<Type, object>(serviceType, serviceKey)));
        }

        /// <summary>If both <paramref name="assignableFromServiceType"/> and <paramref name="serviceKey"/> are null, 
        /// then returns input <paramref name="scope"/>.
        /// Otherwise searches scope hierarchy to find first scope with: Type assignable <paramref name="assignableFromServiceType"/> and 
        /// Key equal to <paramref name="serviceKey"/>.</summary>
        /// <param name="scope">Scope to start matching with Type and Key specified.</param>
        /// <param name="assignableFromServiceType">Type to match.</param> <param name="serviceKey">Key to match.</param>
        /// <param name="outermost">If true - commands to look for outermost match instead of nearest.</param>
        /// <param name="throwIfNotFound">Says to throw if no scope found.</param>
        /// <returns>Matching scope or throws <see cref="ContainerException"/>.</returns>
        IScope IScopeAccess.GetMatchingResolutionScope(IScope scope, Type assignableFromServiceType, object serviceKey,
            bool outermost, bool throwIfNotFound)
        {
            return GetMatchingScopeOrDefault(scope, assignableFromServiceType, serviceKey, outermost)
                ?? (!throwIfNotFound ? null : Throw.For<IScope>(Error.NoMatchedScopeFound,
                new KV<Type, object>(assignableFromServiceType, serviceKey)));
        }

        private static IScope GetMatchingScopeOrDefault(IScope scope, Type assignableFromServiceType, object serviceKey, bool outermost)
        {
            if (assignableFromServiceType == null && serviceKey == null)
                return scope;

            IScope matchedScope = null;
            while (scope != null)
            {
                var name = scope.Name as KV<Type, object>;
                if (name != null &&
                    (assignableFromServiceType == null || name.Key.IsAssignableTo(assignableFromServiceType)) &&
                    (serviceKey == null || serviceKey.Equals(name.Value)))
                {
                    matchedScope = scope;
                    if (!outermost) // break on first found match.
                        break;
                }
                scope = scope.Parent;
            }

            return matchedScope;
        }

        #endregion

        #region IContainer

        /// <summary>The rules object defines policies per container for registration and resolution.</summary>
        public Rules Rules { get; private set; }

        /// <summary>Indicates that container is disposed.</summary>
        public bool IsDisposed
        {
            get { return _disposed == 1; }
        }

        /// <summary>Empty request bound to container. All other requests are created by pushing to empty request.</summary>
        Request IContainer.EmptyRequest
        {
            get { return _emptyRequest; }
        }

        /// <summary>Self weak reference, with readable message when container is GCed/Disposed.</summary>
        ContainerWeakRef IContainer.ContainerWeakRef
        {
            get { return _containerWeakRef; }
        }

        Factory IContainer.ResolveFactory(Request request)
        {
            var factory = GetServiceFactoryOrDefault(request, Rules.FactorySelector);
            if (factory != null && factory.FactoryGenerator != null)
            {
                factory = factory.FactoryGenerator.GenerateFactoryOrDefault(request);
                if (factory != null)
                {
                    var serviceKey = request.ServiceKey is DefaultKey ? null : request.ServiceKey;
                    Register(factory, request.ServiceType, serviceKey, IfAlreadyRegistered.AppendNotKeyed, false);
                }
            }

            if (factory == null)
            {
                var unknownServiceResolvers = Rules.UnknownServiceResolvers;
                if (!unknownServiceResolvers.IsNullOrEmpty())
                    for (var i = 0; factory == null && i < unknownServiceResolvers.Length; i++)
                        factory = unknownServiceResolvers[i](request);
            }

            if (factory == null && request.IfUnresolved == IfUnresolved.Throw)
                ThrowUnableToResolve(request);

            return factory;
        }

        internal static void ThrowUnableToResolve(Request request)
        {
            var container = request.Container;
            var registrations = container.GetAllServiceFactories(request.ServiceType, bothClosedAndOpenGenerics: true)
                .Aggregate(new StringBuilder(), (s, f) =>
                    (f.Value.IsMatchingReuseScope(request)
                        ? s.Append("  ")
                        : s.Append("  without matching scope "))
                        .AppendLine(f.ToString()));

            if (registrations.Length != 0)
            {
                var currentScope = request.Scopes.GetCurrentScope();
                Throw.It(Error.UnableToResolveFromRegisteredServices, request,
                    currentScope, request.Scope, registrations);
            }
            else
            {
                var rules = container.Rules;
                var customUnknownServiceResolversCount =
                    (rules.UnknownServiceResolvers ?? ArrayTools.Empty<Rules.UnknownServiceResolver>())
                    .Except(Rules.Default.UnknownServiceResolvers).Count();

                var fallbackContainersCount =
                    (rules.FallbackContainers ?? ArrayTools.Empty<ContainerWeakRef>()).Length;

                Throw.It(Error.UnableToResolveUnknownService, request,
                    fallbackContainersCount, customUnknownServiceResolversCount);
            }
        }

        Factory IContainer.GetServiceFactoryOrDefault(Request request)
        {
            return GetServiceFactoryOrDefault(request, Rules.FactorySelector);
        }

        IEnumerable<KV<object, Factory>> IContainer.GetAllServiceFactories(Type serviceType, bool bothClosedAndOpenGenerics)
        {
            var serviceFactories = _registry.Value.Services;
            var entry = serviceFactories.GetValueOrDefault(serviceType);
            var factories = RegistryEntryToKeyFactoryPairs(entry);

            if (bothClosedAndOpenGenerics && serviceType.IsClosedGeneric())
            {
                var openGenericEntry = serviceFactories.GetValueOrDefault(serviceType.GetGenericTypeDefinition());
                if (openGenericEntry != null)
                {
                    var openGenericFactories = RegistryEntryToKeyFactoryPairs(openGenericEntry)
                        .Where(ogf => factories.All(f => f.Value.GeneratorFactoryID != ogf.Value.FactoryID))
                        .ToArray();
                    factories = factories.Concat(openGenericFactories);
                }
            }

            return factories;
        }

        private static IEnumerable<KV<object, Factory>> RegistryEntryToKeyFactoryPairs(object entry)
        {
            return entry == null ? Enumerable.Empty<KV<object, Factory>>()
                : entry is Factory ? new[] { new KV<object, Factory>(DefaultKey.Value, (Factory)entry) }
                    : ((FactoriesEntry)entry).Factories.Enumerate();
        }

        Expression IContainer.GetDecoratorExpressionOrDefault(Request request)
        {
            if (_registry.Value.Decorators.IsEmpty &&
                request.Container.Rules.FallbackContainers.IsNullOrEmpty())
                return null;

            // We are already resolving decorator for the service, so stop now.
            var parent = request.ParentNonWrapper();
            if (!parent.IsEmpty && parent.ResolvedFactory.FactoryType == FactoryType.Decorator)
                return null;

            var container = request.Container;

            var serviceType = request.ServiceType;
            var decoratorFuncType = typeof(Func<,>).MakeGenericType(serviceType, serviceType);

            // First look for Func decorators Func<TService,TService> and initializers Action<TService>.
            var funcDecoratorExpr = GetFuncDecoratorExpressionOrDefault(decoratorFuncType, request);

            // Next look for normal decorators.
            var serviceDecorators = container.GetDecoratorFactoriesOrDefault(serviceType);
            var openGenericDecoratorIndex = serviceDecorators == null ? 0 : serviceDecorators.Length;
            var openGenericServiceType = request.ServiceType.GetGenericDefinitionOrNull();
            if (openGenericServiceType != null)
                serviceDecorators = serviceDecorators.Append(container.GetDecoratorFactoriesOrDefault(openGenericServiceType));

            Expression resultDecorator = funcDecoratorExpr;
            if (serviceDecorators != null)
            {
                for (var i = 0; i < serviceDecorators.Length; i++)
                {
                    var decorator = serviceDecorators[i];
                    var decoratorRequest = request.WithResolvedFactory(decorator);
                    var decoratorCondition = decorator.Setup.Condition;
                    if (decoratorCondition == null || decoratorCondition(request))
                    {
                        // Cache closed generic registration produced by open-generic decorator.
                        if (i >= openGenericDecoratorIndex && decorator.FactoryGenerator != null)
                        {
                            decorator = decorator.FactoryGenerator.GenerateFactoryOrDefault(request);
                            Register(decorator, serviceType, null, IfAlreadyRegistered.AppendNotKeyed, false);
                        }

                        var decoratorExpr = GetCachedFactoryExpressionOrDefault(decorator.FactoryID);
                        if (decoratorExpr == null)
                        {
                            decoratorRequest = decoratorRequest.WithFuncArgs(decoratorFuncType,
                                funcArgPrefix: i.ToString()); // use prefix to generate non-conflicting Func argument names

                            decoratorExpr = decorator.GetExpressionOrDefault(decoratorRequest)
                                .ThrowIfNull(Error.UnableToResolveDecorator, decoratorRequest);

                            var decoratedArgWasUsed = decoratorRequest.FuncArgs.Key[0];
                            decoratorExpr = !decoratedArgWasUsed ? decoratorExpr // case of replacing decorator.
                                : Expression.Lambda(decoratorFuncType, decoratorExpr, decoratorRequest.FuncArgs.Value);

                            CacheFactoryExpression(decorator.FactoryID, decoratorExpr);
                        }

                        if (resultDecorator == null || !(decoratorExpr is LambdaExpression))
                            resultDecorator = decoratorExpr;
                        else
                        {
                            if (!(resultDecorator is LambdaExpression))
                                resultDecorator = Expression.Invoke(decoratorExpr, resultDecorator);
                            else
                            {
                                var prevDecorators = ((LambdaExpression)resultDecorator);
                                var decorateDecorator = Expression.Invoke(decoratorExpr, prevDecorators.Body);
                                resultDecorator = Expression.Lambda(decorateDecorator, prevDecorators.Parameters[0]);
                            }
                        }
                    }
                }
            }

            return resultDecorator;
        }

        Factory IContainer.GetWrapperFactoryOrDefault(Type serviceType)
        {
            return _registry.Value.GetWrapperOrDefault(serviceType);
        }

        Factory[] IContainer.GetDecoratorFactoriesOrDefault(Type serviceType)
        {
            Factory[] decorators = null;

            var allDecorators = _registry.Value.Decorators;
            if (!allDecorators.IsEmpty)
                decorators = allDecorators.GetValueOrDefault(serviceType);

            if (!Rules.FallbackContainers.IsNullOrEmpty())
            {
                var fallbackDecorators = Rules.FallbackContainers.SelectMany(r =>
                    r.Container.GetDecoratorFactoriesOrDefault(serviceType) ?? ArrayTools.Empty<Factory>())
                    .ToArrayOrSelf();
                if (!fallbackDecorators.IsNullOrEmpty())
                    decorators = decorators == null
                        ? fallbackDecorators
                        : decorators.Append(fallbackDecorators);
            }

            return decorators;
        }

        Type IContainer.GetWrappedType(Type serviceType, Type requiredServiceType)
        {
            if (requiredServiceType != null && requiredServiceType.IsOpenGeneric())
                return ((IContainer)this).GetWrappedType(serviceType, null);

            serviceType = requiredServiceType ?? serviceType;

            var wrappedType = serviceType.GetArrayElementTypeOrNull();
            if (wrappedType == null)
            {
                var factory = ((IContainer)this).GetWrapperFactoryOrDefault(serviceType);
                if (factory != null)
                {
                    wrappedType = ((Setup.WrapperSetup)factory.Setup)
                        .GetWrappedTypeOrNullIfWrapsRequired(serviceType);
                    if (wrappedType == null)
                        return null;
                }
            }

            return wrappedType == null ? serviceType
                : ((IContainer)this).GetWrappedType(wrappedType, null);
        }

        /// <summary>For given instance resolves and sets properties and fields.</summary>
        /// <param name="instance">Service instance with properties to resolve and initialize.</param>
        /// <param name="propertiesAndFields">(optional) Function to select properties and fields, overrides all other rules if specified.</param>
        /// <returns>Instance with assigned properties and fields.</returns>
        /// <remarks>Different Rules could be combined together using <see cref="PropertiesAndFields.And"/> method.</remarks>        
        public object InjectPropertiesAndFields(object instance, PropertiesAndFieldsSelector propertiesAndFields)
        {
            propertiesAndFields = propertiesAndFields ?? Rules.PropertiesAndFields ?? PropertiesAndFields.Auto;

            var instanceType = instance.ThrowIfNull().GetType();

            var request = _emptyRequest.Push(instanceType)
                .WithResolvedFactory(new ReflectionFactory(instanceType));

            foreach (var serviceInfo in propertiesAndFields(request))
                if (serviceInfo != null)
                {
                    var details = serviceInfo.Details;
                    var value = request.Container.Resolve(serviceInfo.ServiceType,
                        details.ServiceKey, details.IfUnresolved, details.RequiredServiceType);
                    if (value != null)
                        serviceInfo.SetValue(instance, value);
                }

            return instance;
        }

        /// <summary>Adds factory expression to cache identified by factory ID (<see cref="Factory.FactoryID"/>).</summary>
        /// <param name="factoryID">Key in cache.</param>
        /// <param name="factoryExpression">Value to cache.</param>
        public void CacheFactoryExpression(int factoryID, Expression factoryExpression)
        {
            _registry.Value.FactoryExpressionCache.Swap(_ => _.AddOrUpdate(factoryID, factoryExpression));
        }

        /// <summary>Searches and returns cached factory expression, or null if not found.</summary>
        /// <param name="factoryID">Factory ID to lookup by.</param> <returns>Found expression or null.</returns>
        public Expression GetCachedFactoryExpressionOrDefault(int factoryID)
        {
            return _registry.Value.FactoryExpressionCache.Value.GetValueOrDefault(factoryID) as Expression;
        }

        /// <summary>State item objects which may include: singleton instances for fast access, reuses, reuse wrappers, factory delegates, etc.</summary>
        public object[] ResolutionStateCache
        {
            get { return _registry.Value.ResolutionStateCache.Value; }
        }

        /// <summary>Adds item if it is not already added to state, returns added or existing item index.</summary>
        /// <param name="item">Item to find in existing items with <see cref="object.Equals(object, object)"/> or add if not found.</param>
        /// <returns>Index of found or added item.</returns>
        public int GetOrAddStateItem(object item)
        {
            var index = -1;
            _registry.Value.ResolutionStateCache.Swap(state =>
            {
                for (var i = 0; i < state.Length; ++i)
                {
                    var it = state[i];
                    if (it == null || ReferenceEquals(it, item) || Equals(it, item))
                    {
                        if (it == null)
                            state[i] = item;
                        index = i;
                        return state;
                    }
                }

                var size = state.Length;
                var newState = new object[size + 32];
                Array.Copy(state, 0, newState, 0, size);

                index = size;
                newState[index] = item;
                return newState;
            });
            return index;
        }

        /// <summary>If possible wraps added item in <see cref="ConstantExpression"/> (possible for primitive type, Type, strings), 
        /// otherwise invokes <see cref="GetOrAddStateItem"/> and wraps access to added item (by returned index) into expression: state => state.Get(index).</summary>
        /// <param name="item">Item to wrap or to add.</param> <param name="itemType">(optional) Specific type of item, otherwise item <see cref="object.GetType()"/>.</param>
        /// <param name="throwIfStateRequired">(optional) Enable filtering of stateful items.</param>
        /// <returns>Returns constant or state access expression for added items.</returns>
        public Expression GetOrAddStateItemExpression(object item, Type itemType = null, bool throwIfStateRequired = false)
        {
            itemType = itemType ?? (item == null ? typeof(object) : item.GetType());
            var result = GetPrimitiveOrArrayExprOrDefault(item, itemType);
            if (result != null)
                return result;

            if (Rules.ItemToExpressionConverter != null)
            {
                var expression = Rules.ItemToExpressionConverter(item, itemType);
                if (expression != null)
                    return expression;
            }

            Throw.If(throwIfStateRequired, Error.StateIsRequiredToUseItem, item);
            var itemIndex = GetOrAddStateItem(item);
            var indexExpr = Expression.Constant(itemIndex, typeof(int));
            var getItemByIndexExpr = Expression.ArrayIndex(StateParamExpr, indexExpr);
            return Expression.Convert(getItemByIndexExpr, itemType);
        }

        private static Expression GetPrimitiveOrArrayExprOrDefault(object item, Type itemType)
        {
            if (item == null)
                return Expression.Constant(null, itemType);

            itemType = itemType ?? item.GetType();

            if (itemType == typeof(DefaultKey))
                return Expression.Call(typeof(DefaultKey), "Of", ArrayTools.Empty<Type>(),
                    Expression.Constant(((DefaultKey)item).RegistrationOrder));

            if (itemType.IsArray)
            {
                var itType = itemType.GetElementType().ThrowIfNull();
                var items = ((IEnumerable)item).Cast<object>().Select(it => GetPrimitiveOrArrayExprOrDefault(it, itType));
                var itExprs = Expression.NewArrayInit(itType, items);
                return itExprs;
            }

            return itemType.IsPrimitive() || itemType.IsAssignableTo(typeof(Type))
                ? Expression.Constant(item, itemType)
                : null;
        }

        #endregion

        #region Decorators support

        private static LambdaExpression GetFuncDecoratorExpressionOrDefault(Type decoratorFuncType, Request request)
        {
            LambdaExpression funcDecoratorExpr = null;

            var serviceType = request.ServiceType;
            var container = request.Container;

            // Look first for Action<ImplementedType> initializer-decorator
            var implementationType = request.ImplementationType ?? serviceType;
            var implementedTypes = implementationType.GetImplementedTypes(
                ReflectionTools.AsImplementedType.SourceType | ReflectionTools.AsImplementedType.ObjectType);

            for (var i = 0; i < implementedTypes.Length; i++)
            {
                var implementedType = implementedTypes[i];
                var initializerActionType = typeof(Action<>).MakeGenericType(implementedType);
                var initializerFactories = container.GetDecoratorFactoriesOrDefault(initializerActionType);
                if (initializerFactories != null)
                {
                    var doAction = _doMethod.MakeGenericMethod(implementedType, implementationType);
                    for (var j = 0; j < initializerFactories.Length; j++)
                    {
                        var initializerFactory = initializerFactories[j];
                        var condition = initializerFactory.Setup.Condition;
                        if (condition == null || condition(request))
                        {
                            var decoratorRequest =
                                request.WithChangedServiceInfo(_ => ServiceInfo.Of(initializerActionType))
                                    .WithResolvedFactory(initializerFactory);
                            var actionExpr = initializerFactory.GetExpressionOrDefault(decoratorRequest);
                            if (actionExpr != null)
                                ComposeDecoratorFuncExpression(ref funcDecoratorExpr, serviceType,
                                    Expression.Call(doAction, actionExpr));
                        }
                    }
                }
            }

            // Then look for decorators registered as Func of decorated service returning decorator - Func<TService, TService>.
            var funcDecoratorFactories = container.GetDecoratorFactoriesOrDefault(decoratorFuncType);
            if (funcDecoratorFactories != null)
            {
                for (var i = 0; i < funcDecoratorFactories.Length; i++)
                {
                    var decoratorFactory = funcDecoratorFactories[i];
                    var decoratorRequest = request
                        .WithChangedServiceInfo(_ => ServiceInfo.Of(decoratorFuncType))
                        .WithResolvedFactory(decoratorFactory);

                    var condition = decoratorFactory.Setup.Condition;
                    if (condition == null || condition(request))
                    {
                        var funcExpr = decoratorFactory.GetExpressionOrDefault(decoratorRequest);
                        if (funcExpr != null)
                            ComposeDecoratorFuncExpression(ref funcDecoratorExpr, serviceType, funcExpr);
                    }
                }
            }

            return funcDecoratorExpr;
        }

        private static void ComposeDecoratorFuncExpression(ref LambdaExpression result, Type serviceType, Expression decoratorFuncExpr)
        {
            if (result == null)
            {
                var decorated = Expression.Parameter(serviceType, "decorated" + serviceType.Name);
                result = Expression.Lambda(Expression.Invoke(decoratorFuncExpr, decorated), decorated);
            }
            else
            {
                var decorateDecorator = Expression.Invoke(decoratorFuncExpr, result.Body);
                result = Expression.Lambda(decorateDecorator, result.Parameters[0]);
            }
        }

        private static readonly MethodInfo _doMethod = typeof(Container)
            .GetSingleMethodOrNull("DoAction", includeNonPublic: true);
        internal static Func<T, R> DoAction<T, R>(Action<T> action) where R : T
        {
            return x => { action(x); return (R)x; };
        }

        #endregion

        #region Factories Add/Get

        private sealed class FactoriesEntry
        {
            public readonly DefaultKey LastDefaultKey;
            public readonly ImTreeMap<object, Factory> Factories;

            public FactoriesEntry(DefaultKey lastDefaultKey, ImTreeMap<object, Factory> factories)
            {
                LastDefaultKey = lastDefaultKey;
                Factories = factories;
            }
        }

        private Factory GetServiceFactoryOrDefault(Request request, Rules.FactorySelectorRule factorySelector)
        {
            var serviceType = request.ServiceType;
            var serviceKey = request.ServiceKey;
            var requiredServiceType = request.RequiredServiceType;
            var serviceFactories = _registry.Value.Services;

            object entry;
            if (requiredServiceType != null && requiredServiceType.IsOpenGeneric())
            {
                entry = serviceFactories.GetValueOrDefault(requiredServiceType);
            }
            else
            {
                entry = serviceFactories.GetValueOrDefault(serviceType);
                if (serviceType.IsGeneric()) // only for generic types
                {
                    if (entry == null)
                    {
                        entry = serviceFactories.GetValueOrDefault(serviceType.GetGenericTypeDefinition());
                    }
                    else if (serviceKey != null) // Check if concrete Entry does not contain factory for specified key
                    {
                        var factoriesEntry = entry as FactoriesEntry;
                        if (factoriesEntry != null && factoriesEntry.Factories.GetValueOrDefault(serviceKey) == null ||
                            entry is Factory && !DefaultKey.Value.Equals(serviceKey))
                        {
                            var openGenericEntry = serviceFactories.GetValueOrDefault(serviceType.GetGenericTypeDefinition());
                            if (openGenericEntry != null)
                                entry = openGenericEntry;
                        }
                    }
                }
            }

            if (entry == null) // no entry - no factories: return earlier
                return null;

            var singleFactory = entry as Factory;
            if (factorySelector != null) // handle selector
            {
                var allFactories = singleFactory != null
                    ? new[] { new KeyValuePair<object, Factory>(DefaultKey.Value, singleFactory) }
                    : ((FactoriesEntry)entry).Factories.Enumerate()
                        .Where(f => f.Value.CheckCondition(request))
                        .Select(f => new KeyValuePair<object, Factory>(f.Key, f.Value))
                        .ToArray();
                return factorySelector(request, allFactories);
            }

            if (singleFactory != null)
                return (serviceKey == null || DefaultKey.Value.Equals(serviceKey))
                    && singleFactory.CheckCondition(request) ? singleFactory : null;

            var factories = ((FactoriesEntry)entry).Factories;
            if (serviceKey != null)
            {
                singleFactory = factories.GetValueOrDefault(serviceKey);
                return singleFactory != null && singleFactory.CheckCondition(request) ? singleFactory : null;
            }

            var defaultFactories = factories.Enumerate()
                .Where(f => f.Key is DefaultKey && f.Value.CheckCondition(request))
                .ToArray();

            if (defaultFactories.Length == 1)
            {
                var defaultFactory = defaultFactories[0];

                // NOTE: For resolution root sets correct default key to be used in delegate cache.
                if (request.Parent.IsEmpty)
                    request.ChangeServiceKey(defaultFactory.Key);

                return defaultFactory.Value;
            }

            if (defaultFactories.Length > 1 && request.IfUnresolved == IfUnresolved.Throw)
                Throw.It(Error.ExpectedSingleDefaultFactory, serviceType, defaultFactories);

            return null;
        }

        #endregion

        #region Implementation

        private int _disposed;

        private readonly Ref<Registry> _registry;

        private readonly ContainerWeakRef _containerWeakRef;
        private readonly Request _emptyRequest;

        private readonly IScope _singletonScope;
        private readonly IScope _openedScope;
        private readonly IScopeContext _scopeContext;

        private sealed class Registry
        {
            public static readonly Registry Empty = new Registry();
            public static readonly Registry Default = new Registry(WrappersSupport.Wrappers);

            // Factories:
            public readonly ImTreeMap<Type, object> Services;
            public readonly ImTreeMap<Type, Factory[]> Decorators;
            private readonly ImTreeMap<Type, Factory> _wrappers;

            // Cache:
            public readonly Ref<ImTreeMap<Type, FactoryDelegate>> DefaultFactoryDelegateCache;
            public readonly Ref<ImTreeMap<KV<Type, object>, FactoryDelegate>> KeyedFactoryDelegateCache;
            public readonly Ref<ImTreeMapIntToObj> FactoryExpressionCache;
            public readonly Ref<object[]> ResolutionStateCache;

            public Registry WithoutCache()
            {
                return new Registry(Services, Decorators, _wrappers,
                    Ref.Of(ImTreeMap<Type, FactoryDelegate>.Empty), Ref.Of(ImTreeMap<KV<Type, object>, FactoryDelegate>.Empty),
                    Ref.Of(ImTreeMapIntToObj.Empty), Ref.Of(ArrayTools.Empty<object>()));
            }

            private Registry(ImTreeMap<Type, Factory> wrapperFactories = null)
                : this(ImTreeMap<Type, object>.Empty,
                    ImTreeMap<Type, Factory[]>.Empty,
                    wrapperFactories ?? ImTreeMap<Type, Factory>.Empty,
                    Ref.Of(ImTreeMap<Type, FactoryDelegate>.Empty),
                    Ref.Of(ImTreeMap<KV<Type, object>, FactoryDelegate>.Empty),
                    Ref.Of(ImTreeMapIntToObj.Empty),
                    Ref.Of(ArrayTools.Empty<object>()))
            { }

            private Registry(
                ImTreeMap<Type, object> services,
                ImTreeMap<Type, Factory[]> decorators,
                ImTreeMap<Type, Factory> wrappers,
                Ref<ImTreeMap<Type, FactoryDelegate>> defaultFactoryDelegateCache,
                Ref<ImTreeMap<KV<Type, object>, FactoryDelegate>> keyedFactoryDelegateCache,
                Ref<ImTreeMapIntToObj> factoryExpressionCache,
                Ref<object[]> resolutionStateCache)
            {
                Services = services;
                Decorators = decorators;
                _wrappers = wrappers;
                DefaultFactoryDelegateCache = defaultFactoryDelegateCache;
                KeyedFactoryDelegateCache = keyedFactoryDelegateCache;
                FactoryExpressionCache = factoryExpressionCache;
                ResolutionStateCache = resolutionStateCache;
            }

            private Registry WithServices(ImTreeMap<Type, object> services)
            {
                return services == Services ? this :
                    new Registry(services, Decorators, _wrappers,
                        DefaultFactoryDelegateCache.NewRef(), KeyedFactoryDelegateCache.NewRef(),
                        FactoryExpressionCache.NewRef(), ResolutionStateCache.NewRef());
            }

            private Registry WithDecorators(ImTreeMap<Type, Factory[]> decorators)
            {
                return decorators == Decorators ? this :
                    new Registry(Services, decorators, _wrappers,
                        DefaultFactoryDelegateCache.NewRef(), KeyedFactoryDelegateCache.NewRef(),
                        FactoryExpressionCache.NewRef(), ResolutionStateCache.NewRef());
            }

            private Registry WithWrappers(ImTreeMap<Type, Factory> wrappers)
            {
                return wrappers == _wrappers ? this :
                    new Registry(Services, Decorators, wrappers,
                        DefaultFactoryDelegateCache.NewRef(), KeyedFactoryDelegateCache.NewRef(),
                        FactoryExpressionCache.NewRef(), ResolutionStateCache.NewRef());
            }

            public IEnumerable<ServiceRegistrationInfo> GetServiceRegistrations()
            {
                foreach (var entry in Services.Enumerate())
                {
                    var serviceType = entry.Key;
                    var factory = entry.Value as Factory;
                    if (factory != null)
                        yield return new ServiceRegistrationInfo(factory, serviceType, null);
                    else
                    {
                        var factories = ((FactoriesEntry)entry.Value).Factories;
                        foreach (var f in factories.Enumerate())
                            yield return new ServiceRegistrationInfo(f.Value, serviceType, f.Key);
                    }
                }
            }

            public Registry Register(Factory factory, Type serviceType, IfAlreadyRegistered ifAlreadyRegistered, object serviceKey)
            {
                return factory.FactoryType == FactoryType.Service
                    ? WithService(factory, serviceType, serviceKey, ifAlreadyRegistered)
                    : factory.FactoryType == FactoryType.Decorator
                        ? WithDecorators(Decorators.AddOrUpdate(serviceType, new[] { factory }, ArrayTools.Append))
                        : WithWrappers(_wrappers.AddOrUpdate(serviceType, factory));
            }

            public bool IsRegistered(Type serviceType, object serviceKey, FactoryType factoryType, Func<Factory, bool> condition)
            {
                serviceType = serviceType.ThrowIfNull();
                switch (factoryType)
                {
                    case FactoryType.Wrapper:
                        var wrapper = GetWrapperOrDefault(serviceType);
                        return wrapper != null && (condition == null || condition(wrapper));

                    case FactoryType.Decorator:
                        var decorators = Decorators.GetValueOrDefault(serviceType);
                        return decorators != null && decorators.Length != 0
                               && (condition == null || decorators.Any(condition));

                    default:
                        var entry = Services.GetValueOrDefault(serviceType);
                        if (entry == null)
                            return false;

                        var factory = entry as Factory;
                        if (factory != null)
                            return (serviceKey == null || DefaultKey.Value.Equals(serviceKey))
                                   && (condition == null || condition(factory));

                        var factories = ((FactoriesEntry)entry).Factories;
                        if (serviceKey == null)
                            return condition == null || factories.Enumerate().Any(f => condition(f.Value));

                        factory = factories.GetValueOrDefault(serviceKey);
                        return factory != null && (condition == null || condition(factory));
                }
            }

            public Factory GetWrapperOrDefault(Type serviceType)
            {
                return _wrappers.GetValueOrDefault(serviceType.GetGenericDefinitionOrNull() ?? serviceType);
            }

            private Registry WithService(Factory factory, Type serviceType, object serviceKey, IfAlreadyRegistered ifAlreadyRegistered)
            {
                Factory replacedFactory = null;
                ImTreeMap<Type, object> services;
                if (serviceKey == null)
                {
                    services = Services.AddOrUpdate(serviceType, factory, (oldEntry, newFactory) =>
                    {
                        if (oldEntry == null)
                            return newFactory;

                        var oldFactories = oldEntry as FactoriesEntry;
                        if (oldFactories != null && oldFactories.LastDefaultKey == null) // no default registered yet
                            return new FactoriesEntry(DefaultKey.Value,
                                oldFactories.Factories.AddOrUpdate(DefaultKey.Value, (Factory)newFactory));

                        var oldFactory = oldFactories == null ? (Factory)oldEntry : null;
                        switch (ifAlreadyRegistered)
                        {
                            case IfAlreadyRegistered.Throw:
                                oldFactory = oldFactory ?? oldFactories.Factories.GetValueOrDefault(oldFactories.LastDefaultKey);
                                return Throw.For<object>(Error.UnableToRegisterDuplicateDefault, serviceType, oldFactory);

                            case IfAlreadyRegistered.Keep:
                                return oldEntry;

                            case IfAlreadyRegistered.Replace:
                                replacedFactory = oldFactory ?? oldFactories.Factories.GetValueOrDefault(oldFactories.LastDefaultKey);

                                if (((Factory)newFactory).FactoryID == -1)
                                    ((Factory)newFactory).FactoryID = replacedFactory != null ? replacedFactory.FactoryID : Factory.GetNextID();

                                return oldFactories == null ? newFactory
                                    : new FactoriesEntry(oldFactories.LastDefaultKey,
                                        oldFactories.Factories.AddOrUpdate(oldFactories.LastDefaultKey, (Factory)newFactory));

                            default:
                                if (oldFactories == null)
                                    return new FactoriesEntry(DefaultKey.Value.Next(),
                                        ImTreeMap<object, Factory>.Empty
                                            .AddOrUpdate(DefaultKey.Value, (Factory)oldEntry)
                                            .AddOrUpdate(DefaultKey.Value.Next(), (Factory)newFactory));

                                var nextKey = oldFactories.LastDefaultKey.Next();
                                return new FactoriesEntry(nextKey,
                                    oldFactories.Factories.AddOrUpdate(nextKey, (Factory)newFactory));
                        }
                    });
                }
                else // serviceKey != null
                {
                    var factories = new FactoriesEntry(null, ImTreeMap<object, Factory>.Empty.AddOrUpdate(serviceKey, factory));
                    services = Services.AddOrUpdate(serviceType, factories, (oldEntry, newEntry) =>
                    {
                        if (oldEntry == null)
                            return newEntry;

                        if (oldEntry is Factory) // if registered is default, just add it to new entry
                            return new FactoriesEntry(DefaultKey.Value,
                                ((FactoriesEntry)newEntry).Factories.AddOrUpdate(DefaultKey.Value, (Factory)oldEntry));

                        var oldFactories = (FactoriesEntry)oldEntry;
                        return new FactoriesEntry(oldFactories.LastDefaultKey,
                            oldFactories.Factories.AddOrUpdate(serviceKey, factory, (oldFactory, newFactory) =>
                            {
                                if (oldFactory == null)
                                    return factory;

                                switch (ifAlreadyRegistered)
                                {
                                    case IfAlreadyRegistered.Keep:
                                        return oldFactory;

                                    case IfAlreadyRegistered.Replace:
                                        replacedFactory = oldFactory;
                                        newFactory.FactoryID = replacedFactory.FactoryID;
                                        return newFactory;

                                    //case IfAlreadyRegistered.Throw:
                                    //case IfAlreadyRegistered.AppendNonKeyed:
                                    default:
                                        return Throw.For<Factory>(Error.UnableToRegisterDuplicateKey, serviceType, newFactory, serviceKey, oldFactory);
                                }
                            }));
                    });
                }

                var registry = this;
                if (registry.Services != services)
                {
                    registry = new Registry(services, Decorators, _wrappers,
                        DefaultFactoryDelegateCache.NewRef(), KeyedFactoryDelegateCache.NewRef(),
                        FactoryExpressionCache.NewRef(), ResolutionStateCache.NewRef());

                    if (replacedFactory != null)
                        registry = WithoutFactoryCache(registry, replacedFactory, serviceType, serviceKey);
                }

                return registry;
            }

            public Registry Unregister(FactoryType factoryType, Type serviceType, object serviceKey, Func<Factory, bool> condition)
            {
                switch (factoryType)
                {
                    case FactoryType.Wrapper:
                        Factory removedWrapper = null;
                        var registry = WithWrappers(_wrappers.Update(serviceType, null, (factory, _null) =>
                        {
                            if (factory != null && condition != null && !condition(factory))
                                return factory;
                            removedWrapper = factory;
                            return null;
                        }));

                        return removedWrapper == null ? this
                            : WithoutFactoryCache(registry, removedWrapper, serviceType);

                    case FactoryType.Decorator:
                        Factory[] removedDecorators = null;
                        registry = WithDecorators(Decorators.Update(serviceType, null, (factories, _null) =>
                        {
                            var remaining = condition == null ? null : factories.Where(f => !condition(f)).ToArray();
                            removedDecorators = remaining == null || remaining.Length == 0 ? factories : factories.Except(remaining).ToArray();
                            return remaining;
                        }));

                        if (removedDecorators.IsNullOrEmpty())
                            return this;

                        foreach (var removedDecorator in removedDecorators)
                            registry = WithoutFactoryCache(registry, removedDecorator, serviceType);
                        return registry;

                    default:
                        return UnregisterServiceFactory(serviceType, serviceKey, condition);
                }
            }

            private Registry UnregisterServiceFactory(Type serviceType, object serviceKey = null, Func<Factory, bool> condition = null)
            {
                object removed = null; // Factory or FactoriesEntry or Factory[]
                ImTreeMap<Type, object> services;

                if (serviceKey == null && condition == null) // simplest case with simplest handling
                    services = Services.Update(serviceType, null, (entry, _null) =>
                    {
                        removed = entry;
                        return null;
                    });
                else
                    services = Services.Update(serviceType, null, (entry, _null) =>
                    {
                        if (entry == null)
                            return null;

                        if (entry is Factory)
                        {
                            if ((serviceKey != null && !DefaultKey.Value.Equals(serviceKey)) ||
                                (condition != null && !condition((Factory)entry)))
                                return entry; // keep entry
                            removed = entry; // otherwise remove it (the only case if serviceKey == DefaultKey.Value)
                            return null;
                        }

                        var factoriesEntry = (FactoriesEntry)entry;
                        var oldFactories = factoriesEntry.Factories;
                        var remainingFactories = ImTreeMap<object, Factory>.Empty;
                        if (serviceKey == null) // automatically means condition != null
                        {
                            // keep factories for which condition is true
                            foreach (var factory in oldFactories.Enumerate())
                                if (condition != null && !condition(factory.Value))
                                    remainingFactories = remainingFactories.AddOrUpdate(factory.Key, factory.Value);
                        }
                        else // serviceKey is not default, which automatically means condition == null
                        {
                            // set to null factory with specified key if its found
                            remainingFactories = oldFactories;
                            var factory = oldFactories.GetValueOrDefault(serviceKey);
                            if (factory != null)
                                remainingFactories = oldFactories.Height > 1
                                    ? oldFactories.Update(serviceKey, null)
                                    : ImTreeMap<object, Factory>.Empty;
                        }

                        if (remainingFactories.IsEmpty)
                        {
                            // if no more remaining factories, then delete the whole entry
                            removed = entry;
                            return null;
                        }

                        removed =
                            oldFactories.Enumerate()
                                .Except(remainingFactories.Enumerate())
                                .Select(f => f.Value)
                                .ToArray();

                        if (remainingFactories.Height == 1 && DefaultKey.Value.Equals(remainingFactories.Key))
                            return remainingFactories.Value; // replace entry with single remaining default factory

                        // update last default key if current default key was removed
                        var newDefaultKey = factoriesEntry.LastDefaultKey;
                        if (newDefaultKey != null && remainingFactories.GetValueOrDefault(newDefaultKey) == null)
                            newDefaultKey = remainingFactories.Enumerate().Select(x => x.Key)
                                .OfType<DefaultKey>().OrderByDescending(key => key.RegistrationOrder).FirstOrDefault();
                        return new FactoriesEntry(newDefaultKey, remainingFactories);
                    });

                if (removed == null)
                    return this;

                var registry = WithServices(services);

                if (removed is Factory)
                    return WithoutFactoryCache(registry, (Factory)removed, serviceType, serviceKey);

                var removedFactories = removed as Factory[]
                    ?? ((FactoriesEntry)removed).Factories.Enumerate().Select(f => f.Value).ToArray();

                foreach (var removedFactory in removedFactories)
                    registry = WithoutFactoryCache(registry, removedFactory, serviceType, serviceKey);

                return registry;
            }

            private static Registry WithoutFactoryCache(Registry registry, Factory factory, Type serviceType, object serviceKey = null)
            {
                registry.FactoryExpressionCache.Swap(_ => _.Update(factory.FactoryID, null));
                if (serviceKey == null)
                    registry.DefaultFactoryDelegateCache.Swap(_ => _.Update(serviceType, null));
                else
                    registry.KeyedFactoryDelegateCache.Swap(_ => _.Update(new KV<Type, object>(serviceType, serviceKey), null));

                if (factory.FactoryGenerator != null)
                    foreach (var f in factory.FactoryGenerator.ServiceTypeAndKeyOfGeneratedFactories)
                        registry = registry.Unregister(factory.FactoryType, f.Key, f.Value, null);

                return registry;
            }

            public object ResolveServiceFromCache(Type serviceType, IResolverContext resolverContext)
            {
                var factoryDelegate = DefaultFactoryDelegateCache.Value.GetValueOrDefault(serviceType);
                return factoryDelegate == null ? null : factoryDelegate(ResolutionStateCache.Value, resolverContext, null);
            }
        }

        private Container(Rules rules, Ref<Registry> registry, IScope singletonScope, IScopeContext scopeContext,
            IScope openedScope = null, int disposed = 0)
        {
            Rules = rules;

            _registry = registry;
            _disposed = disposed;

            _singletonScope = singletonScope;
            _scopeContext = scopeContext;
            _openedScope = openedScope;

            _containerWeakRef = new ContainerWeakRef(this);
            _emptyRequest = Request.CreateEmpty(_containerWeakRef);
        }

        #endregion
    }

    /// <summary>Provides scope context by convention.</summary>
    public static partial class ScopeContext
    {
        /// <summary>Default scope context.</summary>
        public static IScopeContext Default
        {
            get { return _default ?? (_default = GetDefaultScopeContext()); }
        }

        static partial void GetDefaultScopeContext(ref IScopeContext resultContext);

        private static IScopeContext GetDefaultScopeContext()
        {
            IScopeContext context = null;
            GetDefaultScopeContext(ref context);
            // ReSharper disable once ConstantNullCoalescingCondition
            return context ?? new ThreadScopeContext();
        }

        private static IScopeContext _default;
    }

    /// <summary>Wrapper that provides optimistic-concurrency Swap operation implemented using <see cref="Ref.Swap{T}"/>.</summary>
    /// <typeparam name="T">Type of object to wrap.</typeparam>
    public sealed class Ref<T> where T : class
    {
        /// <summary>Gets the wrapped value.</summary>
        public T Value { get { return _value; } }

        /// <summary>Creates ref to object, optionally with initial value provided.</summary>
        /// <param name="initialValue">(optional) Initial value.</param>
        public Ref(T initialValue = default(T))
        {
            _value = initialValue;
        }

        /// <summary>Exchanges currently hold object with <paramref name="getNewValue"/> - see <see cref="Ref.Swap{T}"/> for details.</summary>
        /// <param name="getNewValue">Delegate to produce new object value from current one passed as parameter.</param>
        /// <returns>Returns old object value the same way as <see cref="Interlocked.Exchange(ref int,int)"/></returns>
        /// <remarks>Important: <paramref name="getNewValue"/> May be called multiple times to retry update with value concurrently changed by other code.</remarks>
        public T Swap(Func<T, T> getNewValue)
        {
            return Ref.Swap(ref _value, getNewValue);
        }

        private T _value;
    }
}