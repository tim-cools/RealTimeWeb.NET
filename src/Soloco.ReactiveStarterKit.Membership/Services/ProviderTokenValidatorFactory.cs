using System;
using Soloco.ReactiveStarterKit.Common.Infrastructure;

namespace Soloco.ReactiveStarterKit.Membership.Services
{
    public class ProviderTokenValidatorFactory : IProviderTokenValidatorFactory
    {
        private readonly IProviderTokenValidator[] _providerTokenValidators;

        public ProviderTokenValidatorFactory(IProviderTokenValidator[] providerTokenValidators)
        {
            if (providerTokenValidators == null) throw new ArgumentNullException(nameof(providerTokenValidators));

            _providerTokenValidators = providerTokenValidators;
        }

        public IProviderTokenValidator Create(string provider)
        {
            foreach (var validator in _providerTokenValidators)
            {
                if (validator.Name.Equals(provider, StringComparison.InvariantCultureIgnoreCase))
                {
                    return validator;
                }
            }

            throw new BusinessException("Invalid provider: " + provider);
        }
    }
}