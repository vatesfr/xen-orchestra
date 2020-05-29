`servers.csv`:

```csv
host,username,password
xs1.company.net,user1,password1
xs2.company.net:8080,user2,password2
http://xs3.company.net,user3,password3
```

> The CSV file can also contains these optional fields: `label`, `autoConnect`, `allowUnauthorized`.

Shell command:

```
> xo-import-servers-csv 'https://xo.company.tld' admin@admin.net admin < servers.csv
```
