namespace Soloco.RealTimeWeb.ViewModels.Installation
{
    public class InstallationResponse
    {
        public bool Complete { get; }

        public InstallationResponse(bool complete)
        {
            Complete = complete;
        }
    }
}