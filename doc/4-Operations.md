*This doc is work in progress and will be completed in the near future*

- Log in Aws console
  - Security credentials
  - Create user (use accesskey and secret key)
  - Assign rights: AdministratorAccess (TODO: assign more specific roles)

run  Environment migration tool

``src\Soloco.RealTimeWeb.Environment\bin\Debug\Soloco.RealTimeWeb.Environment.exe AmazonAccessKey=ENTER_YOUR_ACCESS_KEY_HERE AmazonSecretKey=ENTER_YOUR_SECRET_KEY_HERE DatabaseMasterPassword=SPECIFY_A_DB_MASTER_PASSWORD``

Settings
--------
All default setting can be found in the app.config:

```  
{
  "connectionStrings": {
  },
  "amazon": {
    "region": "eu-west-1",
    "accessKey": "",
    "secretKey": ""
  },
  "database": {
    "name": "RealTimeWeb",
    "instanceClass": "db.m1.small",
    "backupRetentionPeriod": "0",          //disable backups for now
    "masterUserName": "RealTimeWebAdmin",
    "masterUserPassword": ""
  },
  "Logging": {
    "IncludeScopes": false,
    "LogLevel": {
      "Default": "Verbose",
      "System": "Information",
      "Microsoft": "Information"
    }
  }
}
```
  
To override a setting you can add it to the command line arguments.

The deployment environment in AW is created. This environment contains:
- A Postgresql RDS instance
- A ECS Docker Cluster of two EC2 instances
- A load balancer for each application

Troubleshooting
---------------
- A client error (InsufficientDBInstanceCapacity) occurred when calling the CreateDBInstance operation: Cannot create a db.t2.micro database instance because there are no availability zones with sufficient capacity for non-VPC and storage type : standard for db.t2.micro. Please try the request again at a later time.
> use a different DatabaseInstanceClass (see: https://aws.amazon.com/rds/postgresql/
