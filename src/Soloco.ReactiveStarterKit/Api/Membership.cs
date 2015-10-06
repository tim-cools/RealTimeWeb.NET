using Microsoft.AspNet.SignalR;

namespace Soloco.ReactiveStarterKit.Api
{
    public class Membership : Hub
    {
        public void Login(string userName, string password)
        {
            Clients.Caller.LoginSuccessful(userName);
        }
    }
}