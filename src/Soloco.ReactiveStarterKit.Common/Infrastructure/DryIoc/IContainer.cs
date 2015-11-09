using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Exposes operations required for internal registry access. 
    /// That's why most of them are implemented explicitly by <see cref="Container"/>.</summary>
    public interface IContainer : IRegistrator, IResolver, IDisposable
    {
        /// <summary>Self weak reference, with readable message when container is GCed/Disposed.</summary>
        ContainerWeakRef ContainerWeakRef { get; }

        /// <summary>Rules for defining resolution/registration behavior throughout container.</summary>
        Rules Rules { get; }

        /// <summary>Empty request bound to container. All other requests are created by pushing to empty request.</summary>
        Request EmptyRequest { get; }

        /// <summary>State item objects which may include: singleton instances for fast access, reuses, reuse wrappers, factory delegates, etc.</summary>
        object[] ResolutionStateCache { get; }

        /// <summary>Copies all of container state except Cache and specifies new rules.</summary>
        /// <param name="configure">(optional) Configure rules, if not specified then uses Rules from current container.</param> 
        /// <param name="scopeContext">(optional) New scope context, if not specified then uses context from current container.</param>
        /// <returns>New container.</returns>
        IContainer With(Func<Rules, Rules> configure = null, IScopeContext scopeContext = null);

        /// <summary>Returns new container with all expression, delegate, items cache removed/reset.
        /// It will preserve resolved services in Singleton/Current scope.</summary>
        /// <returns>New container with empty cache.</returns>
        IContainer WithoutCache();

        /// <summary>Creates new container with whole state shared with original except singletons.</summary>
        /// <returns>New container with empty Singleton Scope.</returns>
        IContainer WithoutSingletonsAndCache();

        /// <summary>Shares all parts with original container But copies registration, so the new registration
        /// won't be visible in original. Registrations include decorators and wrappers as well.</summary>
        /// <param name="preserveCache">(optional) If set preserves cache if you know what to do.</param>
        /// <returns>New container with copy of all registrations.</returns>
        IContainer WithRegistrationsCopy(bool preserveCache = false);

        /// <summary>Returns scope context associated with container.</summary>
        IScopeContext ScopeContext { get; }

        /// <summary>Creates new container with new opened scope and set this scope as current in ambient scope context.</summary>
        /// <param name="name">(optional) Name for opened scope to allow reuse to identify the scope.</param>
        /// <param name="configure">(optional) Configure rules, if not specified then uses Rules from current container.</param> 
        /// <returns>New container with different current scope.</returns>
        /// <example><code lang="cs"><![CDATA[
        /// using (var scoped = container.OpenScope())
        /// {
        ///     var handler = scoped.Resolve<IHandler>();
        ///     handler.Handle(data);
        /// }
        /// ]]></code></example>
        IContainer OpenScope(object name = null, Func<Rules, Rules> configure = null);

        /// <summary>Creates container (facade) that fallbacks to this container for unresolved services.
        /// Facade shares rules with this container, everything else is its own. 
        /// It could be used for instance to create Test facade over original container with replacing some services with test ones.</summary>
        /// <remarks>Singletons from container are not reused by facade, to achieve that rather use <see cref="OpenScope"/> with <see cref="Reuse.InCurrentScope"/>.</remarks>
        /// <returns>New facade container.</returns>
        IContainer CreateFacade();

        /// <summary>Searches for requested factory in registry, and then using <see cref="DryIoc.Rules.UnknownServiceResolvers"/>.</summary>
        /// <param name="request">Factory request.</param>
        /// <returns>Found factory, otherwise null if <see cref="Request.IfUnresolved"/> is set to <see cref="IfUnresolved.ReturnDefault"/>.</returns>
        Factory ResolveFactory(Request request);

        /// <summary>Searches for registered service factory and returns it, or null if not found.</summary>
        /// <param name="request">Factory request.</param>
        /// <returns>Found registered factory or null.</returns>
        Factory GetServiceFactoryOrDefault(Request request);

        /// <summary>Finds all registered default and keyed service factories and returns them.
        /// It skips decorators and wrappers.</summary>
        /// <param name="serviceType">Service type to look for, may be open-generic type too.</param>
        /// <param name="bothClosedAndOpenGenerics">(optional) For generic serviceType instructs to look for
        /// both closed and open-generic registrations.</param>
        /// <returns>Enumerable of found pairs.</returns>
        /// <remarks>Returned Key item should not be null - it should be <see cref="DefaultKey.Value"/>.</remarks>
        IEnumerable<KV<object, Factory>> GetAllServiceFactories(Type serviceType, bool bothClosedAndOpenGenerics = false);

        /// <summary>Searches for registered wrapper factory and returns it, or null if not found.</summary>
        /// <param name="serviceType">Service type to look for.</param> <returns>Found wrapper factory or null.</returns>
        Factory GetWrapperFactoryOrDefault(Type serviceType);

        /// <summary>Returns all decorators registered for the service type.</summary> <returns>Decorator factories.</returns>
        Factory[] GetDecoratorFactoriesOrDefault(Type serviceType);

        /// <summary>Creates decorator expression: it could be either Func{TService,TService}, 
        /// or service expression for replacing decorators.</summary>
        /// <param name="request">Decorated service request.</param>
        /// <returns>Decorator expression.</returns>
        Expression GetDecoratorExpressionOrDefault(Request request);

        /// <summary>For given instance resolves and sets properties and fields.</summary>
        /// <param name="instance">Service instance with properties to resolve and initialize.</param>
        /// <param name="propertiesAndFields">(optional) Function to select properties and fields, overrides all other rules if specified.</param>
        /// <returns>Instance with assigned properties and fields.</returns>
        /// <remarks>Different Rules could be combined together using <see cref="PropertiesAndFields.And"/> method.</remarks>     
        object InjectPropertiesAndFields(object instance, PropertiesAndFieldsSelector propertiesAndFields);

        /// <summary>If <paramref name="serviceType"/> is generic type then this method checks if the type registered as generic wrapper,
        /// and recursively unwraps and returns its type argument. This type argument is the actual service type we want to find.
        /// Otherwise, method returns the input <paramref name="serviceType"/>.</summary>
        /// <param name="serviceType">Type to unwrap. Method will return early if type is not generic.</param>
        /// <param name="requiredServiceType">Required service type or null if don't care.</param>
        /// <returns>Unwrapped service type in case it corresponds to registered generic wrapper, or input type in all other cases.</returns>
        Type GetWrappedType(Type serviceType, Type requiredServiceType);

        /// <summary>Adds factory expression to cache identified by factory ID (<see cref="Factory.FactoryID"/>).</summary>
        /// <param name="factoryID">Key in cache.</param>
        /// <param name="factoryExpression">Value to cache.</param>
        void CacheFactoryExpression(int factoryID, Expression factoryExpression);

        /// <summary>Searches and returns cached factory expression, or null if not found.</summary>
        /// <param name="factoryID">Factory ID to lookup by.</param> <returns>Found expression or null.</returns>
        Expression GetCachedFactoryExpressionOrDefault(int factoryID);

        /// <summary>If possible wraps added item in <see cref="ConstantExpression"/> (possible for primitive type, Type, strings), 
        /// otherwise invokes <see cref="Container.GetOrAddStateItem"/> and wraps access to added item (by returned index) into expression: state => state.Get(index).</summary>
        /// <param name="item">Item to wrap or to add.</param> <param name="itemType">(optional) Specific type of item, otherwise item <see cref="object.GetType()"/>.</param>
        /// <param name="throwIfStateRequired">(optional) Enable filtering of stateful items.</param>
        /// <returns>Returns constant or state access expression for added items.</returns>
        Expression GetOrAddStateItemExpression(object item, Type itemType = null, bool throwIfStateRequired = false);

        /// <summary>Adds item if it is not already added to state, returns added or existing item index.</summary>
        /// <param name="item">Item to find in existing items with <see cref="object.Equals(object, object)"/> or add if not found.</param>
        /// <returns>Index of found or added item.</returns>
        int GetOrAddStateItem(object item);
    }
}