using Amazon;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public interface IAmazonSettings
    {
        string AccessKey { get; set; }
        RegionEndpoint Region { get; set; }
        string SecretKey { get; set; }
    }
}