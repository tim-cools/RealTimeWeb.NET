using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary> Defines resolution/registration rules associated with Container instance. They may be different for different containers.</summary>
    public sealed class Rules
    {
        /// <summary>No rules specified.</summary>
        /// <remarks>Rules <see cref="UnknownServiceResolvers"/> are empty too.</remarks>
        public static readonly Rules Empty = new Rules();

        /// <summary>Default rules with support for generic wrappers: IEnumerable, Many, arrays, Func, Lazy, Meta, KeyValuePair, DebugExpression.
        /// Check <see cref="WrappersSupport.ResolveWrappers"/> for details.</summary>
        public static readonly Rules Default = Empty.WithUnknownServiceResolvers(
            WrappersSupport.ResolveWrappers,
            ResolveFromFallbackContainers);

        /// <summary>Shorthand to <see cref="Made.FactoryMethod"/></summary>
        public FactoryMethodSelector FactoryMethod { get { return _made.FactoryMethod; } }

        /// <summary>Shorthand to <see cref="Made.Parameters"/></summary>
        public ParameterSelector Parameters { get { return _made.Parameters; } }

        /// <summary>Shorthand to <see cref="Made.PropertiesAndFields"/></summary>
        public PropertiesAndFieldsSelector PropertiesAndFields { get { return _made.PropertiesAndFields; } }

        /// <summary>Returns new instance of the rules with specified <see cref="Made"/>.</summary>
        /// <returns>New rules with specified <see cref="Made"/>.</returns>
        public Rules With(
            FactoryMethodSelector factoryMethod = null,
            ParameterSelector parameters = null,
            PropertiesAndFieldsSelector propertiesAndFields = null)
        {
            var newRules = (Rules)MemberwiseClone();
            newRules._made = Made.Of(
                factoryMethod ?? newRules._made.FactoryMethod,
                parameters ?? newRules._made.Parameters,
                propertiesAndFields ?? newRules._made.PropertiesAndFields);
            return newRules;
        }

        /// <summary>Defines single factory selector delegate.</summary>
        /// <param name="request">Provides service request leading to factory selection.</param>
        /// <param name="factories">Registered factories with corresponding key to select from.</param>
        /// <returns>Single selected factory, or null if unable to select.</returns>
        public delegate Factory FactorySelectorRule(Request request, KeyValuePair<object, Factory>[] factories);

        /// <summary>Rules to select single matched factory default and keyed registered factory/factories. 
        /// Selectors applied in specified array order, until first returns not null <see cref="Factory"/>.
        /// Default behavior is throw on multiple registered default factories, cause it is not obvious what to use.</summary>
        public FactorySelectorRule FactorySelector { get; private set; }

        /// <summary>Sets <see cref="FactorySelector"/></summary> 
        /// <param name="rule">Selectors to set, could be null to use default approach.</param> <returns>New rules.</returns>
        public Rules WithFactorySelector(FactorySelectorRule rule)
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.FactorySelector = rule;
            return newRules;
        }

        /// <summary>Select last registered factory from multiple default.</summary>
        /// <returns>Factory selection rule.</returns>
        public static FactorySelectorRule SelectLastRegisteredFactory()
        {
            return (request, factories) => factories.LastOrDefault(f => f.Key.Equals(request.ServiceKey)).Value;
        }

        //we are watching you...public static
        /// <summary>Prefer specified service key (if found) over default key.
        /// Help to override default registrations in Open Scope scenarios: I may register service with key and resolve it as default in current scope.</summary>
        /// <param name="serviceKey">Service key to look for instead default.</param>
        /// <returns>Found factory or null.</returns>
        public static FactorySelectorRule SelectKeyedOverDefaultFactory(object serviceKey)
        {
            return (request, factories) => request.ServiceKey != null
                // if service key is not default, then look for it
                ? factories.FirstOrDefault(f => f.Key.Equals(request.ServiceKey)).Value
                // otherwise look for specified service key, and if no found look for default.
                : factories.FirstOrDefault(f => f.Key.Equals(serviceKey)).Value
                  ?? factories.FirstOrDefault(f => f.Key.Equals(null)).Value;
        }

        /// <summary>Defines delegate to return factory for request not resolved by registered factories or prior rules.
        /// Applied in specified array order until return not null <see cref="Factory"/>.</summary> 
        /// <param name="request">Request to return factory for</param> <returns>Factory to resolve request, or null if unable to resolve.</returns>
        public delegate Factory UnknownServiceResolver(Request request);

        /// <summary>Gets rules for resolving not-registered services. Null by default.</summary>
        public UnknownServiceResolver[] UnknownServiceResolvers { get; private set; }

        /// <summary>Appends resolver to current unknown service resolvers.</summary>
        /// <param name="rules">Rules to append.</param> <returns>New Rules.</returns>
        public Rules WithUnknownServiceResolvers(params UnknownServiceResolver[] rules)
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.UnknownServiceResolvers = newRules.UnknownServiceResolvers.Append(rules);
            return newRules;
        }

        /// <summary>List of containers to fallback resolution to.</summary>
        public ContainerWeakRef[] FallbackContainers { get; private set; }

        /// <summary>Appends WeakReference fallback container to end of the list.</summary>
        /// <param name="container">To append.</param> <returns>New rules.</returns>
        public Rules WithFallbackContainer(IContainer container)
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.FallbackContainers = newRules.FallbackContainers.AppendOrUpdate(container.ContainerWeakRef);
            return newRules;
        }

        /// <summary>Removes WeakReference to fallback container from the list.</summary>
        /// <param name="container">To remove.</param> <returns>New rules.</returns>
        public Rules WithoutFallbackContainer(IContainer container)
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.FallbackContainers = newRules.FallbackContainers.Remove(container.ContainerWeakRef);
            return newRules;
        }

        private static Factory ResolveFromFallbackContainers(Request request)
        {
            var fallbackContainers = request.Container.Rules.FallbackContainers;
            if (fallbackContainers.IsNullOrEmpty())
                return null;

            for (var i = 0; i < fallbackContainers.Length; i++)
            {
                var containerWeakRef = fallbackContainers[i];
                var containerRequest = request.WithNewContainer(containerWeakRef);

                // Continue to next parent if factory is not found in first parent by
                // updating IfUnresolved policy to ReturnDefault.
                if (containerRequest.IfUnresolved != IfUnresolved.ReturnDefault)
                    containerRequest = containerRequest.WithChangedServiceInfo(info => // NOTE Code Smell
                        ServiceInfo.Of(info.ServiceType, IfUnresolved.ReturnDefault).InheritInfoFromDependencyOwner(info));

                var factory = containerWeakRef.Container.ResolveFactory(containerRequest);
                if (factory != null)
                    return factory;
            }

            return null;
        }

        /// <summary>Removes specified resolver from unknown service resolvers, and returns new Rules.
        /// If no resolver was found then <see cref="UnknownServiceResolvers"/> will stay the same instance, 
        /// so it could be check for remove success or fail.</summary>
        /// <param name="rule">Rule tor remove.</param> <returns>New rules.</returns>
        public Rules WithoutUnknownServiceResolver(UnknownServiceResolver rule)
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.UnknownServiceResolvers = newRules.UnknownServiceResolvers.Remove(rule);
            return newRules;
        }

        /// <summary>Turns on/off exception throwing when dependency has shorter reuse lifespan than its parent.</summary>
        public bool ThrowIfDependencyHasShorterReuseLifespan { get; private set; }

        /// <summary>Returns new rules with <see cref="ThrowIfDependencyHasShorterReuseLifespan"/> set to specified value.</summary>
        /// <returns>New rules with new setting value.</returns>
        public Rules WithoutThrowIfDependencyHasShorterReuseLifespan()
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.ThrowIfDependencyHasShorterReuseLifespan = false;
            return newRules;
        }

        /// <summary>Defines mapping from registered reuse to what will be actually used.</summary>
        /// <param name="reuse">Service registered reuse</param> <param name="request">Context.</param> <returns>Mapped result reuse to use.</returns>
        public delegate IReuse ReuseMappingRule(IReuse reuse, Request request);

        /// <summary>Gets rule to retrieve actual reuse from registered one. May be null, so the registered reuse will be used.
        /// Could be used to specify different reuse container wide, for instance <see cref="Reuse.Singleton"/> instead of <see cref="Reuse.Transient"/>.</summary>
        public ReuseMappingRule ReuseMapping { get; private set; }

        /// <summary>Sets the <see cref="ReuseMapping"/> rule.</summary> <param name="rule">Rule to set, may be null.</param> <returns>New rules.</returns>
        public Rules WithReuseMapping(ReuseMappingRule rule)
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.ReuseMapping = rule;
            return newRules;
        }

        /// <summary>Allow to instantiate singletons during resolution (but not inside of Func). Instantiated singletons
        /// will be copied to <see cref="IContainer.ResolutionStateCache"/> for faster access.</summary>
        public bool SingletonOptimization { get; private set; }

        /// <summary>Disables <see cref="SingletonOptimization"/></summary>
        /// <returns>New rules with singleton optimization turned off.</returns>
        public Rules WithoutSingletonOptimization()
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.SingletonOptimization = false;
            return newRules;
        }

        /// <summary>Given item object and its type should return item "pure" expression presentation, 
        /// without side-effects or external dependencies. 
        /// e.g. for string "blah" <code lang="cs"><![CDATA[]]>Expression.Constant("blah", typeof(string))</code>.
        /// If unable to convert should return null.</summary>
        /// <param name="item">Item object. Item is not null.</param> 
        /// <param name="itemType">Item type. Item type is not null.</param>
        /// <returns>Expression or null.</returns>
        public delegate Expression ItemToExpressionConverterRule(object item, Type itemType);

        /// <summary>Mapping between Type and its ToExpression converter delegate.</summary>
        public ItemToExpressionConverterRule ItemToExpressionConverter { get; private set; }

        /// <summary>Overrides previous rule. You may return null from new rule to fallback to old one.</summary>
        /// <param name="itemToExpressionOrDefault">Converts item to expression or returns null to fallback to old rule.</param>
        /// <returns>New rules</returns>
        public Rules WithItemToExpressionConverter(ItemToExpressionConverterRule itemToExpressionOrDefault)
        {
            var newRules = (Rules)MemberwiseClone();
            var currentRule = newRules.ItemToExpressionConverter;
            newRules.ItemToExpressionConverter = currentRule == null
                ? itemToExpressionOrDefault.ThrowIfNull()
                : (item, itemType) => itemToExpressionOrDefault(item, itemType) ?? currentRule(item, itemType);
            return newRules;
        }

        /// <summary>Flag acting in implicit <see cref="Setup.Condition"/> for service registered with not null <see cref="IReuse"/>.
        /// Condition skips resolution if no matching scope found.</summary>
        public bool ImplicitCheckForReuseMatchingScope { get; private set; }

        /// <summary>Removes <see cref="ImplicitCheckForReuseMatchingScope"/></summary>
        /// <returns>New rules.</returns>
        public Rules WithoutImplicitCheckForReuseMatchingScope()
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.ImplicitCheckForReuseMatchingScope = false;
            return newRules;
        }

        /// <summary>Specifies to resolve IEnumerable as LazyEnumerable.</summary>
        public bool ResolveIEnumerableAsLazyEnumerable { get; private set; }

        /// <summary>Sets flag <see cref="ResolveIEnumerableAsLazyEnumerable"/>.</summary>
        /// <returns>Returns new rules with flag set.</returns>
        public Rules WithResolveIEnumerableAsLazyEnumerable()
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.ResolveIEnumerableAsLazyEnumerable = true;
            return newRules;
        }

        /// <summary>Flag instructs to include covariant compatible types in resolved collection, array and many.</summary>
        public bool VariantGenericTypesInResolvedCollection { get; private set; }

        /// <summary>Unsets flag <see cref="VariantGenericTypesInResolvedCollection"/>.</summary>
        /// <returns>Returns new rules with flag set.</returns>
        public Rules WithoutVariantGenericTypesInResolvedCollection()
        {
            var newRules = (Rules)MemberwiseClone();
            newRules.VariantGenericTypesInResolvedCollection = false;
            return newRules;
        }

        #region Implementation

        private Made _made;
#pragma warning disable 169
        private bool _factoryDelegateCompilationToDynamicAssembly; // NOTE: used by .NET 4 and higher versions.
#pragma warning restore 169

        private Rules()
        {
            _made = Made.Default;
            ThrowIfDependencyHasShorterReuseLifespan = true;
            ImplicitCheckForReuseMatchingScope = true;
            SingletonOptimization = true;
            VariantGenericTypesInResolvedCollection = true;
        }

        #endregion
    }
}