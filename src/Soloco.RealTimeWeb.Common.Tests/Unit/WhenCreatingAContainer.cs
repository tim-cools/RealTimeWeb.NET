using System;
using System.Collections.Generic;
using System.Linq;
using System.Diagnostics;
using Marten;
using Microsoft.Extensions.Configuration;
using Shouldly;
using Soloco.RealTimeWeb.Common.Infrastructure.Messages;
using Soloco.RealTimeWeb.Common.Infrastructure.Store;
using Soloco.RealTimeWeb.Common.Tests.Storage;
using StructureMap;
using Xunit;

namespace Soloco.RealTimeWeb.Common.Tests.Unit
{
    public class WhenCreatingAContainer
    {
        [Fact]
        public void ThenMessageHandlerShouldBeGettable()
        {
            var container = CreateContainer();

            container.GetInstance<ITestStoreDatabaseFactory>()
                .ShouldNotBeNull();
        }

        [Fact]
        public void ThenTheMessagaDispatcherShouldBeGettable()
        {
            var container = CreateContainer();

            container.GetInstance<IMessageDispatcher>()
                .ShouldNotBeNull();
        }

        [Fact]
        public void ThenTheConnectionStringParserShouldBeGettable()
        {
            var container = CreateContainer();

            container.GetInstance<IConnectionStringParser>()
                .ShouldNotBeNull();
        }


        [Fact]
        public void ThenTheMessageHandlerShouldHaveItsOwnSession()
        {
            DummeDocumentSession session = null;
            var container = CreateContainer(config =>
            {
                config.For<IDummySession>().Use("TestSession", context => session = new DummeDocumentSession()).ContainerScoped();
                config.For<IHandleMessage<TestMessage, TestMessage>>().Use<DummyMessageHandler>();
            });

            var dispatcher = container.GetInstance<IMessageDispatcher>();
            dispatcher.ShouldNotBeNull();

            dispatcher.Execute(new TestMessage());

            session.ShouldNotBeNull();
            session.Disposed.ShouldBeTrue();
        }

        private static Container CreateContainer(Action<ConfigurationExpression> extraConfig = null)
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
