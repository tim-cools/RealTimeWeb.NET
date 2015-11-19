DROP DATABASE IF EXISTS test_store;
DROP USER IF EXISTS test_store_user;

CREATE USER test_store_user with PASSWORD 'testStoreUserPassword';
CREATE DATABASE test_store;
GRANT ALL PRIVILEGES ON DATABASE test_store to test_store_user;
