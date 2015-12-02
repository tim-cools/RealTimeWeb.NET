namespace Soloco.RealTimeWeb.Environment.Core
{
    internal interface IMigration
    {
        void Up(Settings setting);
        void Down(Settings setting);
    }
}