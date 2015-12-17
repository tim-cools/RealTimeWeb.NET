using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Soloco.RealTimeWeb.Common;
using Soloco.RealTimeWeb.Membership.Domain;
using Soloco.RealTimeWeb.Membership.Messages.ViewModel;

namespace Soloco.RealTimeWeb.Membership.Services
{
    public abstract class ProviderTokenValidator : IProviderTokenValidator
    {
        public abstract LoginProvider Provider { get; }

        public async Task<ParsedExternalAccessToken> ValidateToken(string accessToken)
        {
            var verifyTokenEndPoint = GetEndpoint(accessToken);
            using (var client = new HttpClient())
            {
                var response = await GetResponse(verifyTokenEndPoint, client);
                var token = await GetJObj(response);

                return ParseToken(token);
            }
        }

        private static async Task<HttpResponseMessage> GetResponse(string verifyTokenEndPoint, HttpClient client)
        {
            var uri = new Uri(verifyTokenEndPoint);
            var response = await client.GetAsync(uri);

            if (!response.IsSuccessStatusCode)
            {
                throw new BusinessException("Could not verify external token");
            }
            return response;
        }

        private static async Task<dynamic> GetJObj(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();

            return (JObject)JsonConvert.DeserializeObject(content);
        }

        protected abstract ParsedExternalAccessToken ParseToken(dynamic jObject);

        protected abstract string GetEndpoint(string accessToken);
    }
}