using System;

namespace Soloco.RealTimeWeb.Common.Tests.Unit.ContainerSpecifications
{
    public class DummeDocumentSession : IDummySession, IDisposable
    {
        public bool Disposed { get; private set; }

        public void Dispose()
        {
            Disposed = true;
        }
    }
}