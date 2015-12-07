//using System;
//using System.Threading.Tasks;
//using System.Web.Http.Dependencies;
//using Microsoft.Owin.Security.Infrastructure;
//using Soloco.RealTimeWeb.Membership;
//using Soloco.RealTimeWeb.Membership.Messages.Commands;

//namespace Soloco.RealTimeWeb.Providers
//{
//    public class RefreshTokenProvider : IAuthenticationTokenProvider
//    {
//        private readonly IDependencyResolver _dependencyResolver;

//        public RefreshTokenProvider(IDependencyResolver dependencyResolver)
//        {
//            if (dependencyResolver == null) throw new ArgumentNullException(nameof(dependencyResolver));

//            _dependencyResolver = dependencyResolver;
//        }

   

//        public void Create(AuthenticationTokenCreateContext context)
//        {
//            throw new NotImplementedException();
//        }

//        public void Receive(AuthenticationTokenReceiveContext context)
//        {
//            throw new NotImplementedException();
//        }
//    }
//}