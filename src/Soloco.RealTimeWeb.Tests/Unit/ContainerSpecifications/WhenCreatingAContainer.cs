using System.Diagnostics;
using System.Runtime.Versioning;
using Microsoft.Extensions.PlatformAbstractions;
using Shouldly;
using Soloco.RealTimeWeb.Common.Messages;
using Soloco.RealTimeWeb.Common.Tests.Unit;
using Soloco.RealTimeWeb.Infrastructure;
using Soloco.RealTimeWeb.Infrastructure.Documentation;
using Xunit;

namespace Soloco.RealTimeWeb.Membership.Tests.Unit.ContainerSpecifications
{
    public class WhenCreatingAContainer
    {
        [Fact]
        public void ThenTheDocumentMessageHandlerShouldBeGettable()
        {
            var container = TestContainerFactory.CreateContainer(config =>
            {
                config.AddRegistry<WebRegistry>();
                config.For<IApplicationEnvironment>().Use<DummyApplicationEnvironment>();
            });

            Debug.WriteLine(container.WhatDidIScan());

            container.GetInstance<IHandleMessage<DocumentQuery, Document>>()
                .ShouldNotBeNull();
        }
    }

    public class DummyApplicationEnvironment: IApplicationEnvironment
    {
        public object GetData(string name)
        {
            throw new System.NotImplementedException();
        }

        public void SetData(string name, object value)
        {
            throw new System.NotImplementedException();
        }

        public string ApplicationName { get; }
        public string ApplicationVersion { get; }
        public string ApplicationBasePath { get; }
        public string Configuration { get; }
        public FrameworkName RuntimeFramework { get; }
    }
}
