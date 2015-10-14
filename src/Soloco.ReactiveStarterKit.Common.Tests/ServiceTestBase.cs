using Elephanet;
using Soloco.ReactiveStarterKit.Common.Tests;
using Soloco.ReactiveStarterKit.Common.Tests.Storage;

namespace Soloco.ReactiveStarterKit.Membership.Tests.Integration.User.RegisterUserSpecifications
{
    public class ServiceTestBase<T> : SpecificationBase
    {
        protected IDocumentSession Session { get; private set; }

        protected T Service { get; private set; }

        protected override void Given()
        {
            base.Given();

            Service = TestContainer.Resolve<T>();
        }

        protected override void When()
        {
            base.When();

            Session = TestStore.CreateSession();
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
