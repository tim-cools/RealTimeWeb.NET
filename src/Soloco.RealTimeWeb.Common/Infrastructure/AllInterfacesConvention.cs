using System;
using System.Collections.Generic;
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
            types.FindTypes(TypeClassification.Concretes | TypeClassification.Closed)
                .Each(service => RegisterInterfaces(registry, service));
        }

        private static IEnumerable<Type> RegisterInterfaces(Registry registry, Type service)
        {
            return service.GetInterfaces()
                .Each(@interface => registry.For(@interface).Use(service));
        }
    }
}