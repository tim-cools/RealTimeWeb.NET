using System;
using System.Collections.Generic;
using Soloco.ReactiveStarterKit.Membership.Models;

namespace Soloco.ReactiveStarterKit
{
    internal sealed class Configuration // : DbMigrationsConfiguration<AngularJSAuthentication.API.AuthContext>
    {
        //public Configuration()
        //{
        //    AutomaticMigrationsEnabled = false;
        //}

        //protected override void Seed(AngularJSAuthentication.API.AuthContext context)
        //{
        //    if (context.Clients.Count() > 0)
        //    {
        //        return;
        //    }

        //    context.Clients.AddRange(BuildClientsList());
        //    context.SaveChanges();
        //}

        public static List<Client> BuildClientsList()
        {

            List<Client> ClientsList = new List<Client>
            {
                new Client
                {
                    Id = Guid.NewGuid(),
                    Key = "ngAuthApp",
                    Secret= Helper.GetHash("abc@123"),
                    Name="AngularJS front-end Application",
                    ApplicationType =  ApplicationTypes.JavaScript,
                    Active = true,
                    RefreshTokenLifeTime = 7200,
                    AllowedOrigin = "http://localhost:32150"
                },
                new Client
                {
                    Id = Guid.NewGuid(),
                    Key = "consoleApp",
                    Secret=Helper.GetHash("123@abc"),
                    Name="Console Application",
                    ApplicationType =ApplicationTypes.NativeConfidential,
                    Active = true,
                    RefreshTokenLifeTime = 14400,
                    AllowedOrigin = "*"
                }
            };

            return ClientsList;
        }
    }
}