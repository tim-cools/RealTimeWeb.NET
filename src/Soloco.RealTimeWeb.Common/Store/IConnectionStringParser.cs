namespace Soloco.RealTimeWeb.Common.Store
{
    public interface IConnectionStringParser
    {
        string GetString(string name = "documentStore");
        ConnectionString Parse(string name = "documentStore");
    }
}