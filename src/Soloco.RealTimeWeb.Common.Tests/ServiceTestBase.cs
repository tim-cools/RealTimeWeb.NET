using System;
using Marten;

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

        protected virtual void Given(TestContext<T> context)
        {
        }

        protected abstract void When(TestContext<T> context);

        protected void SessionScope(Action<TestContext<T>> execute)
        {
            SessionScope<T>(execute);
        }

        protected void SessionScope<TService>(Action<TestContext<TService>> execute)
        {
            if (execute == null) throw new ArgumentNullException(nameof(execute));

            using (var container = _fixture.OpenContainerScope())
            {
                var context = new TestContext<TService>(container);
                execute(context);
            }
        }

        private void CleanDocuments(TestContext<IDocumentStore> context)
        {
            context.Service.Advanced.Clean.DeleteAllDocuments();
        }
    }
}
