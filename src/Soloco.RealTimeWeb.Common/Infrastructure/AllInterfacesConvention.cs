using System;
using System.Collections.Generic;
using System.Linq;
using Baseline;
using StructureMap;
using StructureMap.Graph;
using StructureMap.Graph.Scanning;

namespace Soloco.RealTimeWeb.Common.Tests.Unit
{
    public class AllInterfacesConvention : IRegistrationConvention
    {
        public void ScanTypes(TypeSet types, Registry registry)
        {
            types.FindTypes(TypeClassification.Concretes | TypeClassification.Closed).ToList()
                .ForEach(service => RegisterInterfaces(registry, service));
        }

        private static IEnumerable<Type> RegisterInterfaces(Registry registry, Type service)
        {
            var types = service.GetInterfaces().ToList();
            types.ForEach(@interface => registry.For(@interface).Use(service));
            return types;
        }
    }
}