using System;
using Marten;
using Microsoft.Extensions.Configuration;
using StructureMap;

namespace Soloco.RealTimeWeb.Common.Tests
{
    public class TestContext<TService>
    {
        public IContainer Container { get; }
        public TService Service { get; }
        public IDocumentSession Session { get; }
        public IConfiguration Configuration { get; }

        public TestContext(IContainer container)
        {
            if (container == null) throw new ArgumentNullException(nameof(container));

            Container = container;
            Service = container.GetInstance<TService>();
            Session = container.GetInstance<IDocumentSession>();
            Configuration = container.GetInstance<IConfiguration>();
        }
    }
}