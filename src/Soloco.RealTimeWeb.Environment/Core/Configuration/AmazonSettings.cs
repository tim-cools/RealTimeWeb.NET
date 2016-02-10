using Amazon;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public class AmazonSettings
    {
        public string AccessKey { get; set; }
        public string SecretKey { get; set; }
        public RegionEndpoint Region { get; set; }
    }
}