using Marten;
using Marten.Schema;

namespace Soloco.ReactiveStarterKit.Common.Tests
{
    public abstract class ServiceTestBase<T> : SpecificationBase
    {
        protected IDocumentSession Session { get; private set; }

        protected T Service { get; private set; }

        protected override void Given()
        {
            base.Given();

            Service = TestContainer.Resolve<T>();
            Session = TestContainer.Resolve<IDocumentSession>();

            var cleaner = TestContainer.Resolve<IDocumentCleaner>();
            cleaner.DeleteAllDocuments();
        }

        protected override void When()
        {
            base.When();

            Session = TestContainer.Resolve<IDocumentSession>();
        }

        protected override void CleanUp()
        {
            base.CleanUp();

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
