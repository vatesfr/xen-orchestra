
import argparse
import os
import socket
import subprocess
import time

def send(host, port, key, path):
    client_socket = socket.socket()
    client_socket.connect((host, int(port)))
    print("Connected to server.")
    #client_socket.send(key)
    #data = client_socket.recv(1024)  # Adjust buffer size as needed
    with open(path, 'rb') as file:
        data = file.read(1024*1024)
        while data:
            client_socket.send(data)
            data = file.read(1024*1024)
    client_socket.close()
    print("File sent.")


def execute_command(file_path):
    result = subprocess.Popen(['vhd-tool', 'get', file_path,'parent-unicode-name'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = result.communicate()
    if result.returncode == 0:
        output = stdout.strip()
        if output:
            print(output)
            return execute_command(os.path.join(os.path.dirname(file_path), output))
        else:
            print("Command produced an empty result.")
            print(file_path)
            return file_path
    else:
	    print("Command failed with exit code {}.".format(result.returncode))

def main():
    parser = argparse.ArgumentParser(description="look for the root file of a vhd chain and send it to a tcp server")
    parser.add_argument("file_path", help="Path to the file to be processed.")
    parser.add_argument("host", help="host with the TCP server.")
    parser.add_argument("port", help="port of the tcp server")
    parser.add_argument("key", help="authent key")
    args = parser.parse_args()

    root_path = execute_command(args.file_path)
    print(root_path)
    send(args.host, args.port, args.key, root_path)

if __name__ == "__main__":
    main()




