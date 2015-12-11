using System;
using System.Diagnostics;
using Microsoft.Extensions.Configuration;
using StructureMap;

namespace Soloco.RealTimeWeb.Common.Tests.Unit.MessageDispatcher
{
    public static class TestContainerFactory
    {
        public static Container CreateContainer(Action<ConfigurationExpression> extraConfig = null)
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