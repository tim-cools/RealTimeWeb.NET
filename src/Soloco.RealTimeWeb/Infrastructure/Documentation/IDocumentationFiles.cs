namespace Soloco.RealTimeWeb.Infrastructure.Documentation
{
    public interface IDocumentationFiles
    {
        string[] GetFiles();
        string ReadFile(string id);
    }
}