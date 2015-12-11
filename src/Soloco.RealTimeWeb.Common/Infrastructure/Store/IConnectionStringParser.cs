namespace Soloco.RealTimeWeb.Common.Infrastructure.Store
{
    public interface IConnectionStringParser
    {
        string GetString(string name = "documentStore");
        ConnectionString Parse(string name = "documentStore");
    }
}