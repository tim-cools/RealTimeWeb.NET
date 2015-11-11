using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Soloco.ReactiveStarterKit.Common.Infrastructure;
using Soloco.ReactiveStarterKit.Membership.Domain;
using Soloco.ReactiveStarterKit.Membership.Messages.Commands;
using Soloco.ReactiveStarterKit.Membership.Messages.ViewModel;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public abstract class ProviderTokenValidator : IProviderTokenValidator
    {
        public abstract LoginProvider Provider { get; }

        public async Task<ParsedExternalAccessToken> ValidateToken(string accessToken)
        {
            var verifyTokenEndPoint = GetEndpoint(accessToken);
            var client = new HttpClient();
            var uri = new Uri(verifyTokenEndPoint);
            var response = await client.GetAsync(uri);

            if (!response.IsSuccessStatusCode)
            {
                throw new BusinessException("Could not verify external token");
            }

            var content = await response.Content.ReadAsStringAsync();

            dynamic jObj = (JObject)JsonConvert.DeserializeObject(content);

            return ParseToken(jObj);
        }

        protected abstract ParsedExternalAccessToken ParseToken(dynamic jObject);

        protected abstract string GetEndpoint(string accessToken);
    }
}