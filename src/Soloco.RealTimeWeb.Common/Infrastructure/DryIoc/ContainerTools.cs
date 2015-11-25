using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    /// <summary>Convenient methods that require container.</summary>
    public static class ContainerTools
    {
        /// <summary>For given instance resolves and sets properties and fields.
        /// It respects <see cref="DryIoc.Rules.PropertiesAndFields"/> rules set per container, 
        /// or if rules are not set it uses <see cref="PropertiesAndFields.Auto"/>, 
        /// or you can specify your own rules with <paramref name="propertiesAndFields"/> parameter.</summary>
        /// <typeparam name="TService">Input and returned instance type.</typeparam>Service (wrapped)
        /// <param name="container">Usually a container instance, cause <see cref="Container"/> implements <see cref="IResolver"/></param>
        /// <param name="instance">Service instance with properties to resolve and initialize.</param>
        /// <param name="propertiesAndFields">(optional) Function to select properties and fields, overrides all other rules if specified.</param>
        /// <returns>Input instance with resolved dependencies, to enable fluent method composition.</returns>
        /// <remarks>Different Rules could be combined together using <see cref="PropertiesAndFields.And"/> method.</remarks>        
        public static TService InjectPropertiesAndFields<TService>(this IContainer container,
            TService instance, PropertiesAndFieldsSelector propertiesAndFields = null)
        {
            return (TService)container.InjectPropertiesAndFields(instance, propertiesAndFields);
        }

        /// <summary>Creates service using container for injecting parameters without registering anything.</summary>
        /// <param name="container">Container to use for type creation and injecting its dependencies.</param>
        /// <param name="concreteType">Type to instantiate.</param>
        /// <param name="made">(optional) Injection rules to select constructor/factory method, inject parameters, properties and fields.</param>
        /// <returns>Object instantiated by constructor or object returned by factory method.</returns>
        public static object New(this IContainer container, Type concreteType, Made made = null)
        {
            concreteType.ThrowIfNull().ThrowIf(concreteType.IsOpenGeneric(), Error.UnableToNewOpenGeneric);
            var factory = new ReflectionFactory(concreteType, null, made, Setup.With(cacheFactoryExpression: false));
            factory.ThrowIfInvalidRegistration(container, concreteType, null, isStaticallyChecked: false);
            var request = container.EmptyRequest.Push(ServiceInfo.Of(concreteType)).WithResolvedFactory(factory);
            var factoryDelegate = factory.GetDelegateOrDefault(request);
            var service = factoryDelegate(container.ResolutionStateCache, container.ContainerWeakRef, null);
            return service;
        }

        /// <summary>Creates service using container for injecting parameters without registering anything.</summary>
        /// <typeparam name="T">Type to instantiate.</typeparam>
        /// <param name="container">Container to use for type creation and injecting its dependencies.</param>
        /// <param name="made">(optional) Injection rules to select constructor/factory method, inject parameters, properties and fields.</param>
        /// <returns>Object instantiated by constructor or object returned by factory method.</returns>
        public static T New<T>(this IContainer container, Made made = null)
        {
            return (T)container.New(typeof(T), made);
        }

        /// <summary>Registers new service type with factory for registered service type. 
        /// Throw if no such registered service type in container.</summary>
        /// <param name="container">Container</param> <param name="serviceType">New service type.</param>
        /// <param name="registeredServiceType">Existing registered service type.</param>
        /// <param name="serviceKey">(optional)</param> <param name="registeredServiceKey">(optional)</param>
        /// <remarks>Does nothing if registration is already exists.</remarks>
        public static void RegisterMapping(this IContainer container, Type serviceType, Type registeredServiceType,
            object serviceKey = null, object registeredServiceKey = null)
        {
            var request = container.EmptyRequest.Push(registeredServiceType, registeredServiceKey);
            var factory = container.GetServiceFactoryOrDefault(request);
            factory.ThrowIfNull(Error.RegisterMappingNotFoundRegisteredService,
                registeredServiceType, registeredServiceKey);
            container.Register(factory, serviceType, serviceKey, IfAlreadyRegistered.Keep, false);
        }

        /// <summary>Registers new service type with factory for registered service type. 
        /// Throw if no such registered service type in container.</summary>
        /// <param name="container">Container</param>
        /// <typeparam name="TService">New service type.</typeparam>
        /// <typeparam name="TRegisteredService">Existing registered service type.</typeparam>
        /// <param name="serviceKey">(optional)</param> <param name="registeredServiceKey">(optional)</param>
        /// <remarks>Does nothing if registration is already exists.</remarks>
        public static void RegisterMapping<TService, TRegisteredService>(this IContainer container,
            object serviceKey = null, object registeredServiceKey = null)
        {
            container.RegisterMapping(typeof(TService), typeof(TRegisteredService), serviceKey, registeredServiceKey);
        }

        /// <summary>Adds rule to register unknown service when it is resolved.</summary>
        /// <param name="container">Container to add rule to.</param>
        /// <param name="implTypes">Provider of implementation types.</param>
        /// <param name="changeDefaultReuse">(optional) Delegate to change auto-detected (Singleton or Current) scope reuse to another reuse.</param>
        /// <param name="condition">(optional) condition.</param>
        /// <returns>Container with new rule.</returns>
        /// <remarks>Types provider will be asked on each rule evaluation.</remarks>
        public static IContainer WithAutoFallbackResolution(this IContainer container,
            IEnumerable<Type> implTypes,
            Func<IReuse, Request, IReuse> changeDefaultReuse = null,
            Func<Request, bool> condition = null)
        {
            return container.ThrowIfNull().With(rules =>
                rules.WithUnknownServiceResolvers(
                    AutoRegisterUnknownServiceRule(implTypes, changeDefaultReuse, condition)));
        }

        /// <summary>Adds rule to register unknown service when it is resolved.</summary>
        /// <param name="container">Container to add rule to.</param>
        /// <param name="implTypeAssemblies">Provides assembly with implementation types.</param>
        /// <param name="changeDefaultReuse">(optional) Delegate to change auto-detected (Singleton or Current) scope reuse to another reuse.</param>
        /// <param name="condition">(optional) condition.</param>
        /// <returns>Container with new rule.</returns>
        /// <remarks>Implementation types will be requested from assemblies only once, in this method call.</remarks>
        public static IContainer WithAutoFallbackResolution(this IContainer container,
            IEnumerable<Assembly> implTypeAssemblies,
            Func<IReuse, Request, IReuse> changeDefaultReuse = null,
            Func<Request, bool> condition = null)
        {
            var types = implTypeAssemblies.ThrowIfNull()
                .SelectMany(a => ReflectionTools.GetLoadedTypes(a))
                .Where(type => !type.IsAbstract() && !type.IsCompilerGenerated())
                .ToArray();
            return container.WithAutoFallbackResolution(types, changeDefaultReuse, condition);
        }

        /// <summary>Fallback rule to automatically register requested service with Reuse based on resolution source.</summary>
        /// <param name="implTypes">Assemblies to look for implementation types.</param>
        /// <param name="changeDefaultReuse">(optional) Delegate to change auto-detected (Singleton or Current) scope reuse to another reuse.</param>
        /// <param name="condition">(optional) condition.</param>
        /// <returns>Rule.</returns>
        public static Rules.UnknownServiceResolver AutoRegisterUnknownServiceRule(
            IEnumerable<Type> implTypes,
            Func<IReuse, Request, IReuse> changeDefaultReuse = null,
            Func<Request, bool> condition = null)
        {
            return request =>
            {
                if (condition != null && !condition(request))
                    return null;

                var currentScope = request.Scopes.GetCurrentScope();
                var reuse = currentScope != null
                    ? Reuse.InCurrentNamedScope(currentScope.Name)
                    : Reuse.Singleton;

                if (changeDefaultReuse != null)
                    reuse = changeDefaultReuse(reuse, request);

                request.Container.RegisterMany(implTypes, reuse,
                    serviceTypeCondition: type => type.IsAssignableTo(request.ServiceType));

                return request.Container.GetServiceFactoryOrDefault(request);
            };
        }

        /// <summary>Checks if custom value of the <paramref name="customValueType"/> is supported by DryIoc injection mechanism.</summary>
        /// <param name="customValueType">Type to check</param> <returns>True if supported, false otherwise.c</returns>
        public static bool IsSupportedInjectedCustomValueType(Type customValueType)
        {
            return customValueType == typeof(DefaultKey)
                   || customValueType.IsAssignableTo(typeof(Type))
                   || customValueType.IsPrimitive()
                   || customValueType.IsArray && IsSupportedInjectedCustomValueType(customValueType.GetArrayElementTypeOrNull());
        }
    }
}