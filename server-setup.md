# Virtual Server setup (Windows)

Step by step instruction to setup a web server on a virtual machine (VM)/virtual server. It specifically handles the installation of tools used by the __DokuVis__ application.

This instruction is specified to Windows machines.

#### Directories

Two folders should be created: one for all the projects data and one for temporal files. They can be anywhere on the server. As examples in this instruction, they are named

    C:/DATA/DokuVis-Data
    C:/DATA/DokuVis-Tmp  

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
    DocumentRoot "C:/www/DokuVis/dist"
    ServerName dokuvis.org

    <Directory "C:/www/DokuVis/dist">
        DirectoryIndex index.html
        Require all granted
    </Directory>

    Alias "/data/" "C:/DATA/DokuVis-Data/"

    <Directory "C:/DATA/DokuVis-Data/">
        Require all granted
    </Directory>

    ProxyPass /api/ http://localhost:3000/ timeout=600 keepalive=on
    ProxyPassReverse /api/ http://localhost:3000/

</VirtualHost>
```

Important is the `Alias` directive to point to the data folder, which is located somewhere else on the server, and the `ProxyPass` directive to pass forward the API request to the Node.js application. Timeout is set to 600 seconds or more, as processing of some files may take a while.

Directory paths should be appropriately set.

#### Windows Firewall
To get access to the webserver from outside, you need to configure Windows Firewall. Add a new Inbound Rule to enable access for Port `80`. Additionally, repeat it for Port `443` for SSL connections, later on.

## Internet Information Services (IIS)

When running windows server, you might want to use IIS for serving websites.

Basic setup will not be described at this point. The server should serve the content within the `dist` folder.

But few additional actions are necessary within the IIS Manager:

#### Virtual Directory
Right-click on the site and `Add Virtual Directory...`. Alias should be `data` and the path should point to the data directory.

#### Reverse Proxy
If not already installed, install __Application Request Routing__ (ARR). This can be done via the _Web Platform Installer_. (If using IIS with Plesk, there might be some issues with permissions for user `psacln` executing ARR).

In IIS Manager, go to the server instance and open `Application Request Routing Cache` and open `Server Proxy Settings`. As processing of some files may take a while, set `Time-out` to __600__ or even __900__ seconds. Apply!

On website, there should be `URL Rewrite` now available. Open it and do following steps:
1. Click on `Add Rule(s)...`
2. Select `Reverse Proxy`
3. For server or IP address, enter `localhost:3000`. OK.
4. Edit this rule and set the _Pattern_: `^api/(.*)`
5. _Rewrite URL_ should be: `http://localhost:3000/{R:1}`

#### Read permissions
As the data folder is outside the actual website directory and is only connected by a virtual directory path, we need to set read permission for the user serving the website (using Plesk it would be user `psacln`).

Right-click on folder `C:/DATA/DokuVis-Data`. In `Properies` > `Security` tab, add `Read` permission for user `psacln`. Repeat this for fileder `C:/DATA/DokuVis-Tmp`.


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

To create the tables and triggers, execute following queries:

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

Insert the roles into table:
```sql
INSERT INTO `roles` (`id`, `role`) VALUES
(1, 'admin'),
(2, 'superadmin'),
(3, 'visitor'),
(4, 'modeler'),
(5, 'historian');
```


## Neo4J

Before you install Neo4j, you need to install the **Java Runtime Environment 8 x64** ([Download](http://www.oracle.com/technetwork/java/javase/downloads/jre8-downloads-2133155.html)).

Download zip package (x64) from [Neo4j Download page](https://neo4j.com/download/other-releases/).

Unpack the package. Set environment variable `NEO4J_HOME` to the unpacked folder.

Install as service:

    > bin\neo4j.bat install-service

Start service:

    > bin\neo4j.bat start

Enter `http://localhost:7474` in your browser. First time, you are asked to set a new password.

In the config file `conf/neo4j.conf`, you can specify the name of the database (located in `data/databases`) to mount:

    dbms.active_database=dokuvis.db

#### APOC (Awesome Procedures On Cypher)
Some cypher queries are using procedures of APOC library.

Download from [neo4j-apoc-procedures](https://github.com/neo4j-contrib/neo4j-apoc-procedures) the `jar` file (choose an appropriate version to your Neo4j instance) and copy it into the `plugins` folder.

Add following lines in `conf/neo4j.conf` and restart Neo4j:

    dbms.security.procedures.unrestricted=apoc.when,apoc.do.when

## git

Install [git for windows](https://git-for-windows.github.io/).

Set proxy for git (only if necessary):

    > git config --add http.proxy http://[Your Proxy]:[Proxy Port]
    > git config --add https.proxy http://[Your Proxy]:[Proxy Port]


## Node.js and packages

Download and install Node.js using the Windows Installer: https://nodejs.org/en/download/

#### Configure npm
Set proxy for the node package manager (npm) (only if necessary):

    > npm config set https-proxy http://[Your Proxy]:[Proxy Port]
    > npm config set proxy http://[Your Proxy]:[Proxy Port]

#### Windows-Build-Tools
Some node packages depend on native node modules (e.g. `node-gyp`) that need to be compiled with a C++ compiler. [Windows-Build-Tools](https://github.com/felixrieseberg/windows-build-tools) automatically downloads and installs **Visual C++ Build Tools 2015** and **Python 2.7**.

    > npm install --global windows-build-tools

#### PM2 -- Process Manager
For production environment, a process manager is important to handle Node.js process including restarting them, if they went down. See: http://pm2.keymetrics.io/

    > npm install -g pm2

On windows, if the server restarts, __pm2__ won't restart the script by its own. The solution is to install a windows service.

    > npm install -g pm2-windows-service
    > pm2 service-install -n pm2-starter
    
If not already set, create environment variable `PM2_HOME` and set it to the `.pm2` folder (usually located within the users home folder).

## Server-side tools

These tools are not important for running the web application, but for specific requests like uploading images or 3D models.

#### OpenCTM
Converter for compressing 3D models to `.ctm` files.

Download: http://openctm.sourceforge.net/

#### ImageMagick
Command line tools for converting and processing images.<br>
Use version lower than **7**.

Download: http://www.imagemagick.org/script/download.php#windows

#### Ghostscript
Tool to interprete and render Postscript and PDF.

Download: https://www.ghostscript.com/download/gsdnld.html

#### Assimp
Command line tool to load a variety of 3D file format and perform several cleaning operation (i.a. triangulation).

Download latest (4.1.0) version: https://github.com/assimp/assimp/releases

**Compilation needs to be done manually:**

Create project files (use VS version as available, already there if you installed *windows-build-tools*):

    > cmake CMakelist.txt -G "Visual Studio 14 2015 Win64"

Compile project:

    > MSBuild.exe Assimp.sln /property:Configuration=Release

#### Other
More to come, later on:

* Tesseract OCR
* PDFtk Server
* Swish-e
* ...


## DokuVis setup

Using command prompt, go to the folder for the webpages (e.g. `C:/www`) and clone the main git repository:

    > cd C:\www
    > git clone https://github.com/Brakebein/DokuVis.git

Somewhere else on the server, clone git repository for the Node.js application and install npm packages:

    > git clone https://github.com/Brakebein/DokuVis-Server.git
    > npm install

Copy `config-sample.js` to `config.js`, open it, and set the login information for databases, directory paths, and execution paths.

Start node process:

    > node server.js

Or alternatively, use the process manager.

    > pm2 start server.js
    > pm2 list
    
Run `> pm2 save` to save the list for the `pm2-starter` service. Run `> pm2 log` to see the logs.

Now, the web application should be running.


## DokuVis update

Update repository (in `DokuVis` and `DokuVis-Server` root folder):

    > git fetch --all
    > git reset --hard origin/master

Update npm packages in `DokuVis-Server` folder:

    > npm install

Restart node instance by hitting `Ctrl+C` and `node server.js` or, if using the process manager:

    > pm2 restart all


## Developing DokuVis

The source code client application is located in `src` folder.

#### bower.io
Many frontend javascript frameworks/libraries are managed via [bower.io](https://bower.io/).

    > npm install -g bower

To set proxy settings for bower, go to `%userprofile%` and create a file named `.bowerrc` containing this json (only if necessary):

    {
        "proxy":"http://[Your Proxy]:[Proxy Port]",
        "https-proxy":"http://[Your Proxy]:[Proxy Port]"
    }

Install bower packages:

    > cd src
    > bower install
    
#### Build project

Within the root folder, install the dev packages.

    > npm install --save-dev
    
Building the project means:
1. clean `dist` folder
2. copy, concat, minify, uglify, and rev files
3. replace file urls

Simply run grunt task:

    > grunt build
 

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
