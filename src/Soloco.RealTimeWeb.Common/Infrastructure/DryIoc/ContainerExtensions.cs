using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    public static class ContainerExtensions
    {
        public static IContainer RegisterServicesInNamespace(this IContainer container, IReuse reuse, params Type[] typesWithNamespaceFilter)
        {
            if (reuse == null) throw new ArgumentNullException(nameof(reuse));

            var assemblies = typesWithNamespaceFilter.GroupBy(
                type => type.Assembly,
                (assembly, types) => new { assembly, types });

            foreach (var assemblyWithType in assemblies)
            {
                container.RegisterTypes(assemblyWithType.assembly, assemblyWithType.types, reuse);
            }

            return container;
        }

        public static IContainer RegisterServicesInNamespace(this IContainer container, params Type[] typesWithNamespaceFilter)
        {
            return container.RegisterServicesInNamespace(Reuse.InResolutionScope, typesWithNamespaceFilter);
        }

        private static void RegisterTypes(this IContainer container, Assembly assembly, IEnumerable<Type> types, IReuse reuse)
        {
            var implementingClasses = ImplementingClasses(assembly, types);

            foreach (var implementingClass in implementingClasses)
            {
                container.RegisterAll(implementingClass, reuse);
            }
        }

        private static void RegisterAll(this IContainer container, Type implementation, IReuse reuse)
        {
            if (implementation == null) throw new ArgumentNullException(nameof(implementation));

            var factory = WithFactory(implementation, reuse);

            container.Register(factory, implementation, null, IfAlreadyRegistered.AppendNotKeyed, true);

            foreach (var @interface in implementation.GetInterfaces())
            {
                if (!container.Register(factory, @interface, null, IfAlreadyRegistered.AppendNotKeyed, true))
                {
                    throw new InvalidOperationException("Could not register type: " + @interface);
                }

                //foreach (var baseInterface in @interface.GetImplementedInterfaces())
                //{
                //    container.Register(factory, baseInterface, null, IfAlreadyRegistered.AppendNotKeyed, true);
                //}
            }
        }

        private static Factory WithFactory(Type implementation, IReuse reuse)
        {
            return new ReflectionFactory(implementation, reuse);
        }

        private static IEnumerable<Type> ImplementingClasses(Assembly assembly, IEnumerable<Type> namespacesFilterTypes)
        {
            var types = assembly.GetTypes();
            return types
                .Where(type => IsValidNameSpace(namespacesFilterTypes, type)
                    && type.IsPublic
                    && !type.IsInterface
                    && !type.IsValueType
                    && !type.IsAbstract
                    && type.GetInterfaces().Any());
        }

        private static bool IsValidNameSpace(IEnumerable<Type> namespacesFilter, Type type)
        {
            return namespacesFilter == null
                || namespacesFilter.Any(@namespace => type.Namespace != null
                    && type.Namespace.StartsWith(@namespace.Namespace));
        }
    }
}