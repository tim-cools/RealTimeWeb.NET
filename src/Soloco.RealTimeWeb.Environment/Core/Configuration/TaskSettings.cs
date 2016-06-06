using Amazon;

namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public class TaskSettings
    {
        public string Name { get; set; }
        public string Image { get; set; }
        public int HostPort { get; set; }
        public int ContainerPort { get; set; }
    }
}