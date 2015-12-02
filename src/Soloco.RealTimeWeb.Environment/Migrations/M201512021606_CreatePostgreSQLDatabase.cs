using System;
using System.Linq;
using System.Threading;
using Amazon.RDS;
using Amazon.RDS.Model;
using Amazon.Runtime;
using Soloco.RealTimeWeb.Environment.Core;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201512021606_CreatePostgreSQLDatabase : IMigration
    {
        public void Up(Settings settings)
        {
            using (var client = CreateClient(settings))
            {
                if (!DatabaseExists(client, settings))
                {
                    CreateDatabase(client, settings);
                    WaitUntilInitialized(client, settings);
                }
            }
        }

        public void Down(Settings settings)
        {
            using (var client = CreateClient(settings))
            {
                if (DatabaseExists(client, settings))
                {
                    DeleteDatabase(client, settings);
                    WaitUntilDatabaseDoesNotExists(client, settings);
                }
            }
        }

        private void WaitUntilDatabaseDoesNotExists(IAmazonRDS client, Settings settings)
        {
            while (GetDatabaseInstance(client, settings) != null)
            {
                Thread.Sleep(1000);
            }
        }

        private void DeleteDatabase(IAmazonRDS client, Settings settings)
        {
            var request = new DeleteDBInstanceRequest { DBInstanceIdentifier = settings.DatabaseName, SkipFinalSnapshot = true };
            client.DeleteDBInstance(request);
        }

        private void WaitUntilInitialized(IAmazonRDS client, Settings settings)
        {
            var instance = GetDatabaseInstance(client, settings);
            while (NotInitialized(instance))
            {
                Thread.Sleep(1000);
                instance = GetDatabaseInstance(client, settings);
            }
        }

        private static bool NotInitialized(DBInstance instance)
        {
            Console.WriteLine("New database instance status: " + instance.DBInstanceStatus);
            return instance.DBInstanceStatus == "creating";
        }

        private bool DatabaseExists(IAmazonRDS client, Settings settings)
        {
            var instance = GetDatabaseInstance(client, settings);
            var databaseExists = instance != null;
            Console.WriteLine("DatabaseExists: " + databaseExists);
            return databaseExists;
        }

        private static DBInstance GetDatabaseInstance(IAmazonRDS client, Settings settings)
        {
            var request = new DescribeDBInstancesRequest();
            var instances = client.DescribeDBInstances(request);

            return instances.DBInstances
                .FirstOrDefault(instance => string.Equals(instance.DBInstanceIdentifier, settings.DatabaseName, StringComparison.InvariantCultureIgnoreCase));
        }

        private static void CreateDatabase(IAmazonRDS client, Settings settings)
        {
            var request = new CreateDBInstanceRequest
            {
                Engine = "postgres",
                EngineVersion = "9.4.5",
                DBInstanceClass = settings.DatabaseInstanceClass,
                AllocatedStorage = 5,
                PubliclyAccessible = true,
                BackupRetentionPeriod = settings.DatabaseBackupRetentionPeriod,
                MasterUsername = settings.DatabaseMasterUsername,
                MasterUserPassword = settings.DatabaseMasterPassword,
                DBName = settings.DatabaseName,
                DBInstanceIdentifier = settings.DatabaseName
            };

            client.CreateDBInstance(request);
        }

        private static IAmazonRDS CreateClient(Settings settings)
        {
            var credentials = new BasicAWSCredentials(settings.AmazonAccessKey, settings.AmazonSecretKey);
            return new AmazonRDSClient(credentials, settings.AmazonRegion);
        }
    }
}
