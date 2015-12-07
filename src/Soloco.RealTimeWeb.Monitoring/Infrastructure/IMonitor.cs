namespace Soloco.RealTimeWeb.Monitoring.Infrastructure
{
    public interface IMonitor
    {
        ServiceStatus GetStatus();
    }
}