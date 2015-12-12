//using System;
//using System.Collections.Generic;
//using System.Net.Http;
//using System.Net.Http.Formatting;
//using System.Web.Http;
//using Microsoft.AspNet.Mvc;

//namespace Soloco.RealTimeWeb.Results
//{
//    internal class ApiControllerDependencyProvider : IDependencyProvider
//    {
//        public IContentNegotiator ContentNegotiator { get; }
//        public HttpRequestMessage Request { get; }
//        public IEnumerable<MediaTypeFormatter> Formatters { get; }

//        public ApiControllerDependencyProvider(Controller controller)
//        {
//            if (controller == null) throw new ArgumentNullException(nameof(controller));

//            var configuration = controller.ConConfiguration;
//            if (configuration == null) throw new InvalidOperationException("_controller.Configuration == null");

//            ContentNegotiator = configuration.Services.GetContentNegotiator();
//            if (ContentNegotiator == null) throw new InvalidOperationException("configuration.Services.GetContentNegotiator() == null");

//            Request = controller.Request;
//            if (Request == null) throw new InvalidOperationException("_controller.Request == null");

//            Formatters = configuration.Formatters;
//        }
//    }
//}