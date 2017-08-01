# Virtual Server setup (Windows)

Step to step instruction to setup a web server on a virtual machine (VM)/virtual server. It specifically handles the installation of tools used by the __DokuVis__ application.

This instruction is specified to Windows machines.


## Apache 2.4

Basic HTTP server. Homepage: https://httpd.apache.org/

Windows binaries can be downloaded at [Apache Lounge](https://www.apachelounge.com/download/)

Basic setup instructions: https://httpd.apache.org/docs/2.4/platform/windows.html

#### Running Apache as a Service
Install service via command prompt at the Apache `bin` subdirectory:

    > httpd.exe -k install -n "MyServiceName"

Start service via command prompt:

    > httpd.exe -k start -n "MyServiceName"

Alternatively, the service can be started and stopped using the Services utility of Windows.

Entering the URL `http://localhost/` or `http://127.0.0.1/` within a browser should respond with page saying: "It Works!"

#### Configure Apache
Open `conf/httpd.conf` in editor and uncomment following lines:

```
Include conf/extra/httpd-vhosts.conf

LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_connect_module modules/mod_proxy_connect.so
LoadModule proxy_html_module modules/mod_proxy_html.so
LoadModule proxy_http_module modules/mod_proxy_http.so
```

Open `conf/extra/httpd-vhosts.conf`, remove examples, and add:

```
<VirtualHost *:80>

    ServerAdmin jonas.bruschke@tu-dresden.de
    DocumentRoot "C:/www/DokuVis/app"
    ServerName dokuvis.org

    <Directory "C:/www/DokuVis/app">
        DirectoryIndex index.html
        Require all granted
    </Directory>

    Alias "/data/" "C:/DATA/dokuvis/"

    <Directory "C:/DATA/dokuvis/">
        Require all granted
    </Directory>

    ProxyPass /api/ http://localhost:3000/
    ProxyPassReverse /api/ http://localhost:3000/

</VirtualHost>
```

Directory paths should be appropriately set.

#### Windows Firewall
To get access to the webserver from outside, you need to configure Windows Firewall. Add a new Inbound Rule to enable access for Port `80`. Additionally, repeat it for Port `443` for SSL connections, later on.


## MySQL

MySQL is mainly used to store user credentials and project entries.

Download of the free **MySQL Community Server**: https://dev.mysql.com/downloads/mysql/

General installation instructions: https://dev.mysql.com/doc/refman/5.7/en/windows-install-archive.html

#### Basic setup

Download zip file and extract it to `C:/mysql/`. Create folder for the data: `C:/mydata/data/`.

Create a file `C:/my.cnf` and insert:

    [mysqld]
    # set basedir to your installation path
    basedir=C:/mysql
    # set datadir to the location of your data directory
    datadir=C:/mydata/data

Using command prompt, initialize the data directory:

    > bin\mysqld.exe --initialize

Testing the MySQL server:

    > bin\mysqld.exe --console

Install as a service:

    > bin\mysqld.exe --install

Now, the service is available in the Windows Services utility.

#### Reset password
The default password should be empty, but sometimes it requires a password (experienced with MySQL Workbench). To reset the `root` password, do the following:

1. Stop the service, if running.
2. Create a text file `C:/mysql-init.txt` containing the following line:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNewPass';
   ```
3. Run MySQL:
   ```
   > bin\mysqld.exe --init-file=C:\\mysql-init.txt --console
   ```
4. Stop process, delete `mysql-init.txt`, and start service.

Additional information: https://dev.mysql.com/doc/refman/5.7/en/resetting-permissions.html

#### MySQL Workbench
Free tool for administrating the database.

Download: https://dev.mysql.com/downloads/workbench/

An alternative would be **phpMyAdmin**, but that would require PHP.

#### Initial tables

DokuVis requires four tables to run. First, create a new database named `db_dokuvis`.

To create the tables, execute following queries:

```sql
CREATE TABLE IF NOT EXISTS `projects` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `proj_tstamp` varchar(20) NOT NULL,
  `name` text NOT NULL,
  `description` text,
  PRIMARY KEY (`pid`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `user_project_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 ;

DROP TRIGGER IF EXISTS `project_delete`;
DELIMITER //
CREATE TRIGGER `project_delete` BEFORE DELETE ON `projects`
 FOR EACH ROW BEGIN
    DELETE FROM user_project_role
    WHERE project_id = OLD.pid;
END
//
DELIMITER ;
```


## Neo4J

Before you install Neo4j, you need to install the **Java Runtime Environment 8 x64** ([Download](http://www.oracle.com/technetwork/java/javase/downloads/jre8-downloads-2133155.html)).

Download zip package (x64) from [Neo4j Download page](https://neo4j.com/download/other-releases/).

Install as service:

    > bin\neo4j.bat install-service

Start service:

    > bin\neo4j.bat start

Enter `http://localhost:7474` in your browser. First time, you are asked to set a new password.

In the config file `conf/neo4j.conf`, you can specify the name of the database (located in `data/databases`) to mount:

    dbms.active_database=dokuvis.db


## git

Install [git for windows](https://git-for-windows.github.io/).

Set proxy for git:

    > git config --add http.proxy http://[Your Proxy]:[Proxy Port]
    > git config --add https.proxy http://[Your Proxy]:[Proxy Port]


## Node.js and packages

Download and install Node.js using the Windows Installer: https://nodejs.org/en/download/

#### Configure npm
Set proxy for the node package manager (npm):

    > npm config set https-proxy http://[Your Proxy]:[Proxy Port]
    > npm config set proxy http://[Your Proxy]:[Proxy Port]

#### Windows-Build-Tools
Some node packages depend on native node modules (e.g. `node-gyp`) that need to be compiled with a C++ compiler. [Windows-Build-Tools](https://github.com/felixrieseberg/windows-build-tools) automatically downloads and installs **Visual C++ Build Tools 2015** and **Python 2.7**.

    > npm install --global windows-build-tools

#### bower.io
Most frontend javascript frameworks/libraries are managed via [bower.io](https://bower.io/).

    > npm install -g bower

To set proxy settings for bower, go to `%userprofile%` and create a file named `.bowerrc` containing this json:

    {
        "proxy":"http://[Your Proxy]:[Proxy Port]",
        "https-proxy":"http://[Your Proxy]:[Proxy Port]"
    }

#### PM2 -- Process Manager
For production environment, a process manager is important to handle Node.js process including restarting them, if they went down. See: http://pm2.keymetrics.io/

    > npm install -g pm2


## Server-side tools

These tools are not important for running the web application, but for specific requests like uploading images or 3D models.

#### OpenCTM
Converter for compressing 3D models to `.ctm` files.

Download: http://openctm.sourceforge.net/

#### ImageMagick
Command line tools for converting and processing images.

Download: http://www.imagemagick.org/script/download.php#windows

#### Other
More to come, later on:

* Tesseract OCR
* PDFtk Server
* Swish-e
* ...


## DokuVis setup

Using command prompt, go to the folder for the webpages (e.g. `C:/www`) and clone git repository:

    > cd C:\www
    > git clone https://github.com/Brakebein/DokuVis.git

Go to `DokuVis/app` folder and install bower compononents:

    > cd DokuVis\app
    > bower install

Go to `DokuVis/rest-api` folder and install npm packages:

    > cd ..\rest-api
    > npm install

Copy `rest-api/config-sample.js` to `rest-api/config.js`, open it, and set the login information for databases, directory paths, and execution paths.

Start node process:

    > node server.js

Or alternatively, use the process manager.

    > pm2 start server.js
    > pm2 list

Now, the web application should be running.


## DokuVis update

Update repository (in `DokuVis` root folder):

    > git fetch --all
    > git reset --hard origin/master

Update npm and bower packages:

    > cd app
    > bower install
    > cd ..\rest-api
    > npm install

Restart node instance by hitting `Ctrl+C` and `node server.js` or, if using the process manager:

    > pm2 restart all


## Transfer of project data between server instances

While developing, the databases on your local machine gets populated with project data. Usually after some time, you want this data to be available at production environment on the server, without submitting all the data via the input forms again. To do so, several steps are necessary:

### Data folder

Look and remember the project ID (e.g. `Proj_rk0CkK6$b`).

Copy the folder named with this ID from your local data folder to the data folder on the server.

### MySQL database

*A good workflow still needs to be developed. Maybe via a script.*

### Neo4j data transfer

Reference: [Export a (sub)graph to Cypher script and import it again](https://neo4j.com/developer/kb/export-sub-graph-to-cypher-and-import/)

##### Export

Go to the root folder of your Neo4j instance.

Download from [neo4j-apoc-procedures](https://github.com/neo4j-contrib/neo4j-apoc-procedures) the `jar` file (choose an appropriate version to your Neo4j instance) and copy it to the `plugins` folder.

Add or uncomment following lines in `conf/neo4j.conf` and restart Neo4j: 

    apoc.export.file.enabled=true

Start `cypher-shell`:

    > bin\cypher-shell.bat

Enter user and password, then execute the following statement (replace project ID and output file according to your needs):

    CALL apco.export.cypher.query("match (n:Proj_rk0CkK6$b) optional match (n)-[r]->() return *", "C:/export.cypher", {});

Exit `cypher-shell` by calling `:exit`.

##### Import

Copy `export.cypher` to the server and go to the root folder of the Neo4j instance.

Add or uncomment following lines in `conf/neo4j.conf` and restart Neo4j:

    dbms.shell.enabled=true

Execute following command to import the cypher file:

    > bin\neo4j-shell.bat -file C:\export.cypher


## Update Neo4j version

If updating to a new version of Neo4j, following steps are necessary:

Download and unpack zip archive from: https://neo4j.com/download/other-releases/

Stop and uninstall old Neo4j instance:

    > neo4j_old\bin\neo4j.bat stop
    > neo4j_old\bin\neo4j.bat uninstall-service

Copy `dokuvis.db` from `neo4j_old/data/databaes` to `neo4j_new/data/databases`.

Uncomment following line in `neo4j_new/conf/neo4j.conf`:

    dbms.allow_format_migration=true

Start Neo4j in console mode to run the data migration process:

    > neo4j_new\bin\neo4j.bat console

Exit the process and install and start Neo4j as service:

    > neo4j_new\bin\neo4j.bat install-service
    > neo4j_new\bin\neo4j.bat start
