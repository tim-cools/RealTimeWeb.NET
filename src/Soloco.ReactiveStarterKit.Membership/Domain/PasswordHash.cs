using System;

namespace Soloco.ReactiveStarterKit.Membership.Domain
{
    public class PasswordHash
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Hash { get; set; }

        public PasswordHash()
        {
        }

        public PasswordHash(Guid userId, string hash)
        {
            Id = Guid.NewGuid();
            UserId = userId;

            SetPassword(hash);
        }

        public void SetPassword(string hash)
        {
            Hash = hash;
        }
    }
}