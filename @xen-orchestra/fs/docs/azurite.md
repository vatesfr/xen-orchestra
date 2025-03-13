## Testing Azure Blob Storage Using Azurite emulator

### Prerequisites

- A Linux-based VM with Node.js installed

### Steps

1.  Install Azurite

```sh
npm install -g azurite
```

2.  Run Azurite

```sh
azurite --blobHost 0.0.0.0 --silent --location c:\azurite --debug c:\azurite\debug.log
```

---

**Explanation of Flags:**

- `--blobHost 0.0.0.0` → Binds Azurite to all network interfaces making it accessible from external machines
- `--silent` → Suppresses unnecessary logs
- `--location c:\azurite` → Specifies the directory where Azurite will store data
- `--debug c:\azurite\debug.log` → Enables debug logging for troubleshooting

---

3. Configure Connection String on Your Local Machine

Replace `AZURITE_CONNECTION_STRING` with the following connection string in the storage operations commands:

`DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://<VM_IP>:10000/devstoreaccount1;QueueEndpoint=http://<VM_IP>:10001/devstoreaccount1;TableEndpoint=http://<VM_IP>:10002/devstoreaccount1;`

**Replace `<VM_IP>` with the actual IP address of your VM where Azurite is running.**

---

### 4. Perform Storage Operations

Create a Container (Equivalent to an S3 Bucket)

```sh
az storage container create --name <container_name> --connection-string "AZURITE_CONNECTION_STRING"
```

Upload a Blob (Equivalent to a File/Directory in S3)

```sh
az storage blob upload --account-name devstoreaccount1 --container-name <container_name> --name <blob_name> --file <file_path> --connection-string "AZURITE_CONNECTION_STRING"
```

List All Containers

```sh
az storage container list --connection-string "AZURITE_CONNECTION_STRING"
```

Download a Blob

```sh
az storage blob download --container-name <container_name> --name <blob_name> --file <file_name> --connection-string "AZURITE_CONNECTION_STRING"
```

Delete a Blob

```sh
az storage blob delete --container-name <container_name> --name <blob_name> --connection-string "AZURITE_CONNECTION_STRING"
```

List Blobs Inside a Container

```sh
az storage blob list --container-name <container_name> --connection-string "AZURITE_CONNECTION_STRING"
```

Delete a Container

```sh
az storage container delete --name <container_name> --connection-string "AZURITE_CONNECTION_STRING"
```

---

### Notes

- Ensure your VM allows incoming connections on ports `10000`, `10001`, and `10002` for the Blob, Queue, and Table endpoints, respectively
- Use `--debug` flag while running commands if you need detailed logs
- Replace placeholders (`<VM_IP>`, `<container_name>`, `<blob_name>`, `<file_path>`, `<file_name>`) with actual values before executing commands

Source documentation: https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite?tabs=npm%2Cblob-storage
