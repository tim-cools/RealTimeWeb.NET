using System;
using Marten;
using StructureMap;

namespace Soloco.RealTimeWeb.Common.Tests
{
    public abstract class ServiceTestBase<T>
    {
        private readonly IntegrationTestFixture _fixture;

        protected ServiceTestBase(IntegrationTestFixture fixture)
        {
            _fixture = fixture;

            SessionScope<IDocumentStore>(CleanDocuments);
            SessionScope<T>(Given);
            SessionScope<T>(When);
        }

        protected virtual void Given(T service, IDocumentSession session, IContainer container)
        {
        }

        protected abstract void When(T service, IDocumentSession session, IContainer container);

        protected void SessionScope(Action<T, IDocumentSession, IContainer> execute)
        {
            SessionScope<T>(execute);
        }

        protected void SessionScope<TService>(Action<TService, IDocumentSession, IContainer> execute)
        {
            if (execute == null) throw new ArgumentNullException(nameof(execute));

            using (var container = _fixture.OpenContainerScope())
            {
                var session = container.GetInstance<IDocumentSession>();
                var service = container.GetInstance<TService>();

                execute(service, session, container);
            }
        }

        private void CleanDocuments(IDocumentStore store, IDocumentSession session, IContainer container)
        {
            store.Advanced.Clean.DeleteAllDocuments();
        }
    }
}
