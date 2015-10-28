using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Soloco.ReactiveStarterKit.Common.Infrastructure.DryIoc
{
    public static class ContainerExtensions
    {
        public static IContainer RegisterAssemblyServices(this IContainer container, Assembly assembly, params string[] namespacesFilter)
        {
            var implementingClasses = ImplementingClasses(assembly, namespacesFilter);

            foreach (var implementingClass in implementingClasses)
            {
                container.RegisterAll(implementingClass, Reuse.InResolutionScope);
            }

            return container;
        }

        private static void RegisterAll(this IContainer container, Type implementation, IReuse reuse)
        {
            if (implementation == null) throw new ArgumentNullException(nameof(implementation));

            var factory = WithFactory(implementation, reuse);

            container.Register(factory, implementation, null, IfAlreadyRegistered.AppendNotKeyed, true);

            foreach (var @interface in implementation.GetInterfaces())
            {
                container.Register(factory, @interface, null, IfAlreadyRegistered.AppendNotKeyed, true);
            }
        }

        private static Factory WithFactory(Type implementation, IReuse reuse)
        {
            return new ReflectionFactory(implementation, reuse);
        }

        private static IEnumerable<Type> ImplementingClasses(Assembly assembly, string[] namespacesFilter)
        {
            var types = assembly.GetTypes();
            return types
                .Where(type => IsValidNameSpace(namespacesFilter, type) 
                    && type.IsPublic 
                    && !type.IsInterface
                    && !type.IsValueType
                    && !type.IsAbstract 
                    && type.GetInterfaces().Any());
        }

        private static bool IsValidNameSpace(string[] namespacesFilter, Type type)
        {
            return namespacesFilter == null
                || namespacesFilter.Length == 0
                || namespacesFilter.Any(@namespace => type.Namespace != null 
                    && type.Namespace.StartsWith(@namespace));
        }
    }
}