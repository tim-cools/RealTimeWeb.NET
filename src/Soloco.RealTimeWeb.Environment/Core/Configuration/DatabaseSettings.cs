namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public class DatabaseSettings : IDatabaseSettings
    {
        public string Name { get; set; }
        public int BackupRetentionPeriod { get; set; }
        public string MasterUserName { get; set; }
        public string MasterUserPassword { get; set; }
        public string InstanceClass { get; set; }
    }
}