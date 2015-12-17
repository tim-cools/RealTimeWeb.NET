using System;
using System.Security.Cryptography;
using System.Text;

namespace Soloco.RealTimeWeb.Common.Security
{
    public class Hasher
    {
        public static string ComputeSHA256(string input)
        {
            if (input == null) throw new ArgumentNullException(nameof(input));

            var byteValue = Encoding.UTF8.GetBytes(input);

            using (var hashAlgorithm = new SHA256CryptoServiceProvider())
            {
                var byteHash = hashAlgorithm.ComputeHash(byteValue);

                return Convert.ToBase64String(byteHash);
            }
        }
    }
}