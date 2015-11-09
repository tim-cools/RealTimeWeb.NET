using System;
using System.ComponentModel.DataAnnotations;

namespace Soloco.ReactiveStarterKit.Membership.Domain
{
    public class RefreshToken
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Subject { get; set; }

        [Required]
        [MaxLength(50)]
        public string ClientKey { get; set; }

        public DateTimeOffset? IssuedUtc { get; set; }
        public DateTimeOffset? ExpiresUtc { get; set; }
        [Required]
        public string ProtectedTicket { get; set; }

        public string Hash { get; set; }
    }
}