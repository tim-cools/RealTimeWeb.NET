DROP DATABASE IF EXISTS {database};
DROP USER IF EXISTS {userId};

CREATE USER {userId} with PASSWORD '{password}';
CREATE DATABASE {database};
GRANT ALL PRIVILEGES ON DATABASE {database} to {userId};
