using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using AngularJSAuthentication.API.Models.Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity;

namespace AngularJSAuthentication.API.Models
{
    public enum ApplicationTypes
    {
        JavaScript = 0,
        NativeConfidential = 1
    }

    /// <summary>

    public class IdentityUserLogin : IdentityUserLogin<string>
    {
    }

    public class IdentityUserRole : IdentityUserRole<string>
    {
    }

    public class IdentityUserRole<TKey>
    {
        /// <summary>
        /// UserId for the user that is in the role
        /// 
        /// </summary>
        public virtual TKey UserId { get; set; }

        /// <summary>
        /// RoleId for the role
        /// 
        /// </summary>
        public virtual TKey RoleId { get; set; }
    }

    public class IdentityUser : 
        IdentityUser<string, IdentityUserLogin, IdentityUserRole, IdentityUserClaim>, 
        IUser,
        IUser<string>
    {
        /// <summary>
        /// Constructor which creates a new Guid for the Id
        /// 
        /// </summary>
        public IdentityUser()
        {
            this.Id = Guid.NewGuid().ToString();
        }

        /// <summary>
        /// Constructor that takes a userName
        /// 
        /// </summary>
        /// <param name="userName"/>
        public IdentityUser(string userName)
            : this()
        {
            this.UserName = userName;
        }
    }


    public class IdentityUserClaim<TKey>
    {
        /// <summary>
        /// Primary key
        /// 
        /// </summary>
        public virtual int Id { get; set; }

        /// <summary>
        /// User Id for the user who owns this login
        /// 
        /// </summary>
        public virtual TKey UserId { get; set; }

        /// <summary>
        /// Claim type
        /// 
        /// </summary>
        public virtual string ClaimType { get; set; }

        /// <summary>
        /// Claim value
        /// 
        /// </summary>
        public virtual string ClaimValue { get; set; }
    }

    public class IdentityUserClaim : IdentityUserClaim<string>
    {
    }

    /// <summary>
    /// Default EntityFramework IUser implementation
    /// 
    /// </summary>
    /// <typeparam name="TKey"/><typeparam name="TLogin"/><typeparam name="TRole"/><typeparam name="TClaim"/>
    public class IdentityUser<TKey, TLogin, TRole, TClaim> : IUser<TKey> where TLogin : IdentityUserLogin<TKey>
        where TRole : IdentityUserRole<TKey>
        where TClaim : IdentityUserClaim<TKey>
    {
        /// <summary>
        /// Email
        /// 
        /// </summary>
        public virtual string Email { get; set; }

        /// <summary>
        /// True if the email is confirmed, default is false
        /// 
        /// </summary>
        public virtual bool EmailConfirmed { get; set; }

        /// <summary>
        /// The salted/hashed form of the user password
        /// 
        /// </summary>
        public virtual string PasswordHash { get; set; }

        /// <summary>
        /// A random value that should change whenever a users credentials have changed (password changed, login removed)
        /// 
        /// </summary>
        public virtual string SecurityStamp { get; set; }

        /// <summary>
        /// PhoneNumber for the user
        /// 
        /// </summary>
        public virtual string PhoneNumber { get; set; }

        /// <summary>
        /// True if the phone number is confirmed, default is false
        /// 
        /// </summary>
        public virtual bool PhoneNumberConfirmed { get; set; }

        /// <summary>
        /// Is two factor enabled for the user
        /// 
        /// </summary>
        public virtual bool TwoFactorEnabled { get; set; }

        /// <summary>
        /// DateTime in UTC when lockout ends, any time in the past is considered not locked out.
        /// 
        /// </summary>
        public virtual DateTime? LockoutEndDateUtc { get; set; }

        /// <summary>
        /// Is lockout enabled for this user
        /// 
        /// </summary>
        public virtual bool LockoutEnabled { get; set; }

        /// <summary>
        /// Used to record failures for the purposes of lockout
        /// 
        /// </summary>
        public virtual int AccessFailedCount { get; set; }

        /// <summary>
        /// Navigation property for user roles
        /// 
        /// </summary>
        public virtual ICollection<TRole> Roles { get; private set; }

        /// <summary>
        /// Navigation property for user claims
        /// 
        /// </summary>
        public virtual ICollection<TClaim> Claims { get; private set; }

        /// <summary>
        /// Navigation property for user logins
        /// 
        /// </summary>
        public virtual ICollection<TLogin> Logins { get; private set; }

        /// <summary>
        /// User ID (Primary Key)
        /// 
        /// </summary>
        public virtual TKey Id { get; set; }

        /// <summary>
        /// User name
        /// 
        /// </summary>
        public virtual string UserName { get; set; }

        /// <summary>
        /// Constructor
        /// 
        /// </summary>
        public IdentityUser()
        {
            this.Claims = (ICollection<TClaim>) new List<TClaim>();
            this.Roles = (ICollection<TRole>) new List<TRole>();
            this.Logins = (ICollection<TLogin>) new List<TLogin>();
        }
    }

    // Decompiled with JetBrains decompiler
    // Type: Microsoft.AspNet.Identity.EntityFramework.IdentityUserLogin`1
    // Assembly: Microsoft.AspNet.Identity.EntityFramework, Version=2.0.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35
    // MVID: 9E8F2A4F-0B9A-4646-8E1A-E34788D20E23
    // Assembly location: C:\_\AngulaWebApiAuthentication\AngularJSAuthentication\packages\Microsoft.AspNet.Identity.EntityFramework.2.0.1\lib\net45\Microsoft.AspNet.Identity.EntityFramework.dll

    namespace Microsoft.AspNet.Identity.EntityFramework
    {
        /// <summary>
        /// Entity type for a user's login (i.e. facebook, google)
        /// 
        /// </summary>
        /// <typeparam name="TKey"/>
        public class IdentityUserLogin<TKey>
        {
            /// <summary>
            /// The login provider for the login (i.e. facebook, google)
            /// 
            /// </summary>
            public virtual string LoginProvider { get; set; }

            /// <summary>
            /// Key representing the login for the provider
            /// 
            /// </summary>
            public virtual string ProviderKey { get; set; }

            /// <summary>
            /// User Id for the user who owns this login
            /// 
            /// </summary>
            public virtual TKey UserId { get; set; }
        }
    }
}