namespace Soloco.RealTimeWeb.Environment.Core.Configuration
{
    public interface IDatabaseSettings
    {
        int BackupRetentionPeriod { get; set; }
        string InstanceClass { get; set; }
        string MasterUserPassword { get; set; }
        string MasterUserName { get; set; }
        string Name { get; set; }
    }
}