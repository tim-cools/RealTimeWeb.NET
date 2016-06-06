using System.Diagnostics;
using Microsoft.Extensions.PlatformAbstractions;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests.Unit;
using Soloco.RealTimeWeb.Infrastructure;
using Soloco.RealTimeWeb.Infrastructure.Documentation;
using Xunit;

namespace Soloco.RealTimeWeb.Tests.Unit.ContainerSpecifications
{
    public class WhenCreatingAContainer
    {
        [Fact]
        public void ThenTheDocumentMessageHandlerShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer(config =>
            {
                config.AddRegistry<WebRegistry>();
                config.For<ApplicationEnvironment>().Use(new ApplicationEnvironment());
            });

            Debug.WriteLine(container.WhatDidIScan());

            container.GetInstance<IHandleMessage<DocumentQuery, Document>>()
                .ShouldNotBeNull();
        }
    }
}
