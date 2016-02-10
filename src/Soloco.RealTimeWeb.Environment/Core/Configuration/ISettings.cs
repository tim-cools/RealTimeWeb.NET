namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public interface ISettings
    {
        ClusterSettings Cluster { get; }
        AmazonSettings Amazon { get; }
        DatabaseSettings Database { get; }
    }
}