using Marten;
using Marten.Schema;
using Soloco.RealTimeWeb.Common.Infrastructure.DryIoc;

namespace Soloco.RealTimeWeb.Common.Tests
{
    public abstract class ServiceTestBase<T> : SpecificationBase
    {
        protected IntegrationTestFixture Fixture { get; set; }

        protected IDocumentSession Session { get; private set; }

        protected T Service { get; private set; }

        protected ServiceTestBase(IntegrationTestFixture fixture)
        {
            Fixture = fixture;
        }

        protected override void Given()
        {
            base.Given();

            Service = Fixture.Container.Resolve<T>();
            Session = Fixture.Container.Resolve<IDocumentSession>();

            var cleaner = Fixture.Container.Resolve<IDocumentCleaner>();
            cleaner.DeleteAllDocuments();
        }

        protected override void When()
        {
            base.When();
            Session.Dispose();

            Session = Fixture.Container.Resolve<IDocumentSession>();
        }

        public override void Dispose()
        {
            base.Dispose();

            DisposeSession();
        }

        private void DisposeSession()
        {
            if (Session != null)
            {
                Session.Dispose();
                Session = null;
            }
        }
    }
}
