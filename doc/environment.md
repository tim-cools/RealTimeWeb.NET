- Log in Aws console
  - Security credentioals
  - Create user (use accesskey and secret key)
  - Assign rights: AdministratorAccess (TODO: assign more specific roles)

run  Environment migration tool

``src\Soloco.RealTimeWeb.Environment\bin\Debug\Soloco.RealTimeWeb.Environment.exe AmazonAccessKey=ENTER_YOUR_ACCESS_KEY_HERE AmazonSecretKey=ENTER_YOUR_SECRET_KEY_HERE DatabaseMasterPassword=SPECIFY_A_DB_MASTER_PASSWORD``

Settings
--------
All default setting can be found in the app.config:

``  <appSettings>
    <add key="AmazonRegion" value="eu-west-1"/>
    <add key="AmazonAccessKey" value=""/>
    <add key="AmazonSecretKey" value=""/>

    <!-- disable backups for now -->
    <add key="DatabaseName" value="RealTimeWeb"/>
    <add key="DatabaseInstanceClass" value="db.m1.small"/>
    <add key="DatabaseBackupRetentionPeriod" value="0"/>
    <add key="DatabaseMasterUsername" value="RealTimeWebAdmin"/>
    <add key="DatabaseMasterPassword" value=""/>
  </appSettings>``
  
To override a setting you can add it to the command line arguments.

this tool will create:
- A postgresql RDS instance (
-  
- 

Troubleshooting
---------------
- A client error (InsufficientDBInstanceCapacity) occurred when calling the CreateDBInstance operation: Cannot create a db.t2.micro database instance because there are no availability zones with sufficient capacity for non-VPC and storage type : standard for db.t2.micro. Please try the request again at a later time.
> use a different DatabaseInstanceClass (see: https://aws.amazon.com/rds/postgresql/
