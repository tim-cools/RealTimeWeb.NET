namespace Soloco.RealTimeWeb.Environment.Core
{
    internal interface IMigration
    {
        void Up();
        void Down();
    }
}