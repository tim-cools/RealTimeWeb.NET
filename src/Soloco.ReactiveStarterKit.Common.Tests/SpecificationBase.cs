using NUnit.Framework;

namespace Soloco.ReactiveStarterKit.Common.Tests
{
    [TestFixture]
    public abstract class SpecificationBase
    {
        [SetUp]
        public virtual void Initialize()
        {
            Given();

            try
            {
                When();
            }
            catch
            {
                CleanUp();
                throw;
            }
        }

        [TearDown]
        public void InternCleanup()
        {
            CleanUp();
        }

        protected virtual void Given()
        {
        }

        protected virtual void When()
        {
        }

        protected virtual void CleanUp()
        {
        }
    }
}
