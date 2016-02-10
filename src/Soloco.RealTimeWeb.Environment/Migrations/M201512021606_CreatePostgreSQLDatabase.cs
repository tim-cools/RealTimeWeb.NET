using System;
using System.Linq;
using System.Threading;
using Amazon.RDS;
using Amazon.RDS.Model;
using Amazon.Runtime;
using Soloco.RealTimeWeb.Environment.Core;

namespace Soloco.RealTimeWeb.Environment.Migrations
{
    public class M201512021606_CreatePostgreSQLDatabase : IMigration, IDisposable
    {
        private readonly MigrationContext _context;
        private readonly IAmazonRDS _client;

        public M201512021606_CreatePostgreSQLDatabase(MigrationContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));

            _context = context;
            _client = CreateClient();
        }

        public void Up()
        {
            return;
            if (!DatabaseExists())
            {
                CreateDatabase();
                WaitUntilInitialized();
            }
        }

        public void Down()
        {
            if (DatabaseExists())
            {
                DeleteDatabase();
                WaitUntilDatabaseDoesNotExists();
            }
        }

        private void WaitUntilDatabaseDoesNotExists()
        {
            while (GetDatabaseInstance() != null)
            {
                Thread.Sleep(1000);
            }
        }

        private void DeleteDatabase()
        {
            var request = new DeleteDBInstanceRequest
            {
                DBInstanceIdentifier = _context.Settings.Database.Name,
                SkipFinalSnapshot = true
            };
            _client.DeleteDBInstance(request);
        }

        private void WaitUntilInitialized()
        {
            var instance = GetDatabaseInstance();
            while (NotInitialized(instance))
            {
                Thread.Sleep(1000);
                instance = GetDatabaseInstance();
            }
        }

        private bool NotInitialized(DBInstance instance)
        {
            _context.Logger.WriteLine("New database instance status: " + instance.DBInstanceStatus);
            return instance.DBInstanceStatus == "creating";
        }

        private bool DatabaseExists()
        {
            var instance = GetDatabaseInstance();
            var databaseExists = instance != null;
            _context.Logger.WriteLine("DatabaseExists: " + databaseExists);
            return databaseExists;
        }

        private DBInstance GetDatabaseInstance()
        {
            var request = new DescribeDBInstancesRequest();
            var instances = _client.DescribeDBInstances(request);

            return instances.DBInstances
                .FirstOrDefault(
                    instance =>
                        string.Equals(instance.DBInstanceIdentifier, _context.Settings.Database.Name,
                            StringComparison.InvariantCultureIgnoreCase));
        }

        private void CreateDatabase()
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

            _client.CreateDBInstance(request);
        }

        private IAmazonRDS CreateClient()
        {
            var credentials = new BasicAWSCredentials(_context.Settings.Amazon.AccessKey, _context.Settings.Amazon.SecretKey);
            return new AmazonRDSClient(credentials, _context.Settings.Amazon.Region);
        }

        public void Dispose()
        {
            _client.Dispose();
        }
    }
}
