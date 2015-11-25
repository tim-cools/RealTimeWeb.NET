using Microsoft.AspNet.SignalR;

namespace Soloco.RealTimeWeb.Api
{
    public class Membership : Hub
    {
        public void Login(string userName, string password)
        {
            Clients.Caller.LoginSuccessful(userName);
        }
    }
}