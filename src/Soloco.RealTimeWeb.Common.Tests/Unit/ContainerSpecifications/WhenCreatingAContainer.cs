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
            var container = TestContainerFactory.CreateContainer();

            container.GetInstance<ITestStoreDatabaseFactory>()
                .ShouldNotBeNull();
        }

        [Fact]
        public void ThenTheMessagaDispatcherShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer();

            container.GetInstance<IMessageDispatcher>()
                .ShouldNotBeNull();
        }

        [Fact]
        public void ThenTheConnectionStringParserShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer();

            container.GetInstance<IConnectionStringParser>()
                .ShouldNotBeNull();
        }
    }
}
