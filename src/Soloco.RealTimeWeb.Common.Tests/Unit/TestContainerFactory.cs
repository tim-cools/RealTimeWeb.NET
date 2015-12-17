using System;
using System.Diagnostics;
using Microsoft.Extensions.Configuration;
using Soloco.RealTimeWeb.Common.Tests.Unit.ContainerSpecifications;
using StructureMap;

namespace Soloco.RealTimeWeb.Common.Tests.Unit
{
    public static class TestContainerFactory
    {
        public static IContainer CreateContainer(Action<ConfigurationExpression> extraConfig = null)
        {
            var container = new Container(config =>
            {
                config.AddRegistry<CommonRegistry>();
                config.AddRegistry<TestRegistry>();
                config.For<IConfigurationRoot>().Use<DummyConfiguration>();

                extraConfig?.Invoke(config);
            });

            Debug.WriteLine(container.WhatDidIScan());

            return container;
        }
    }
}