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
        private readonly MigrationContext _context;

        public M201512021606_CreatePostgreSQLDatabase(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
        }

        public void Up()
        {
            using (var client = CreateClient())
            {
                if (!DatabaseExists(client))
                {
                    CreateDatabase(client);
                    WaitUntilInitialized(client);
                }
            }
        }

        public void Down()
        {
            using (var client = CreateClient())
            {
                if (DatabaseExists(client))
                {
                    DeleteDatabase(client);
                    WaitUntilDatabaseDoesNotExists(client);
                }
            }
        }

        private void WaitUntilDatabaseDoesNotExists(IAmazonRDS client)
        {
            while (GetDatabaseInstance(client) != null)
            {
                Thread.Sleep(1000);
            }
        }

        private void DeleteDatabase(IAmazonRDS client)
        {
            var request = new DeleteDBInstanceRequest
            {
                DBInstanceIdentifier = _context.Settings.Database.Name,
                SkipFinalSnapshot = true
            };
            client.DeleteDBInstance(request);
        }

        private void WaitUntilInitialized(IAmazonRDS client)
        {
            var instance = GetDatabaseInstance(client);
            while (NotInitialized(instance))
            {
                Thread.Sleep(1000);
                instance = GetDatabaseInstance(client);
            }
        }

        private bool NotInitialized(DBInstance instance)
        {
            _context.Logger.WriteLine("New database instance status: " + instance.DBInstanceStatus);
            return instance.DBInstanceStatus == "creating";
        }

        private bool DatabaseExists(IAmazonRDS client)
        {
            var instance = GetDatabaseInstance(client);
            var databaseExists = instance != null;
            _context.Logger.WriteLine("DatabaseExists: " + databaseExists);
            return databaseExists;
        }

        private DBInstance GetDatabaseInstance(IAmazonRDS client)
        {
            var request = new DescribeDBInstancesRequest();
            var instances = client.DescribeDBInstances(request);

            return instances.DBInstances
                .FirstOrDefault(
                    instance =>
                        string.Equals(instance.DBInstanceIdentifier, _context.Settings.Database.Name,
                            StringComparison.InvariantCultureIgnoreCase));
        }

        private void CreateDatabase(IAmazonRDS client)
        {
            var request = new CreateDBInstanceRequest
            {
                Engine = "postgres",
                EngineVersion = "9.4.5",
                DBInstanceClass = _context.Settings.Database.InstanceClass,
                AllocatedStorage = 5,
                PubliclyAccessible = true,
                BackupRetentionPeriod = _context.Settings.Database.BackupRetentionPeriod,
                MasterUsername = _context.Settings.Database.MasterUserName,
                MasterUserPassword = _context.Settings.Database.MasterUserPassword,
                DBName = _context.Settings.Database.Name,
                DBInstanceIdentifier = _context.Settings.Database.Name
            };

            client.CreateDBInstance(request);
        }

        private IAmazonRDS CreateClient()
        {
            var credentials = new BasicAWSCredentials(_context.Settings.Amazon.AccessKey, _context.Settings.Amazon.SecretKey);
            return new AmazonRDSClient(credentials, _context.Settings.Amazon.Region);
        }
    }
}
