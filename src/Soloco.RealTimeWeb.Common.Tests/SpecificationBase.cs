using System;
// ReSharper disable DoNotCallOverridableMethodsInConstructor

namespace Soloco.RealTimeWeb.Common.Tests
{
    public abstract class SpecificationBase : IDisposable
    {
        protected SpecificationBase()
        {
            Given();
            When();
        }

        protected virtual void Given()
        {
        }

        protected virtual void When()
        {
        }

        public virtual void Dispose()
        {
        }
    }
}
