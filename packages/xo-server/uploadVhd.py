import argparse
import os
import socket
import subprocess
import time
import struct
import math

# inspired from https://github.com/imcleod/pyvhd/blob/master/pyvhd.py


def divro(num, den):
    # Divide always rounding up and returning an integer
    # Is there some nicer way to do this?
    return int(math.ceil((1.0*num)/(1.0*den)))

def vhd_checksum(buf):
    # This is the checksum defined in the MS spec
    # sum up all bytes in the checked structure then take the ones compliment
    checksum = 0
    for byte in buf:
        checksum += byte
    return ((~checksum) & 0xFFFFFFFF)

def vhd_chs(size):
    # CHS calculation as defined by the VHD spec
    sectors = divro(size, SECTORSIZE)

    if sectors > (65535 * 16 * 255):
        sectors = 65535 * 16 * 255

    if sectors >= 65535 * 16 * 63:
        spt = 255
        cth = sectors / spt
        heads = 16
    else:
        spt = 17
        cth = sectors / spt
        heads = (cth + 1023) / 1024

        if heads < 4:
            heads = 4

        if (cth >= (heads * 1024)) or (heads > 16):
            spt = 31
            cth = sectors / spt
            heads = 16

        if cth >= (heads * 1024):
            spt = 63
            cth = sectors / spt
            heads = 16

    cylinders = cth / heads

    return (cylinders, heads, spt)

def zerostring(len):
    zs = ""
    for i in range(1, len):
        zs += '\0'
    return zs

# Header/Footer - From MS doc
# 512 bytes - early versions had a 511 byte footer for no obvious reason

#Cookie 8
#Features 4
#File Format Version 4
#Data Offset 8
#Time Stamp 4
#Creator Application 4
#Creator Version 4
#Creator Host OS 4
#Original Size 8
#Current Size 8
#Disk Geometry 4
# Disk Cylinders 2
# Disk Heads 1
# Disk Sectors 1
#Disk Type 4
#Checksum 4
#Unique Id 16
#Saved State 1
#Reserved 427

HEADER_FMT = ">8sIIQI4sIIQQHBBII16sB427s"

# Dynamic header
# 1024 bytes

#Cookie 8
#Data Offset 8
#Table Offset 8
#Header Version 4
#Max Table Entries 4
#Block Size 4
#Checksum 4
#Parent Unique ID 16
#Parent Time Stamp 4
#Reserved 4
#Parent Unicode Name 512
#Parent Locator Entry 1 24
#Parent Locator Entry 2 24
#Parent Locator Entry 3 24
#Parent Locator Entry 4 24
#Parent Locator Entry 5 24
#Parent Locator Entry 6 24
#Parent Locator Entry 7 24
#Parent Locator Entry 8 24
#Reserved 256

DYNAMIC_FMT = ">8sQQIIII16sII512s192s256s"

# BAT header 
# This is not in the Microsoft spec but is present in the Xen code
# This is a bitmap of the BAT where "1" indicates the BAT entry is valid
# and "0" indicates that it is unallocated.
#
# Cookie 8 - 'tdbatmap'
# batmap_offset 8 - byte offset to the BAT map
# batmap_size 4 - batmap size in sectors rounded up
# batmap_version 4 - 0x00010002 in vhd-util
# batmap_checksum 4 - 1's compliment of batmap itself

BAT_HDR_FMT = ">8sQIII"

VHD_BLOCKSIZE = 2 * 1024 * 1024 # Default blocksize 2 MB
SECTORSIZE = 512
VHD_BLOCKSIZE_SECTORS = VHD_BLOCKSIZE/SECTORSIZE
VHD_HEADER_SIZE = struct.calcsize(HEADER_FMT)
VHD_DYN_HEADER_SIZE = struct.calcsize(DYNAMIC_FMT)
SECTOR_BITMAP_SIZE = VHD_BLOCKSIZE / SECTORSIZE / 8
FULL_SECTOR_BITMAP = ""
for i in range(0,SECTOR_BITMAP_SIZE):
    FULL_SECTOR_BITMAP += chr(0xFF)
SECTOR_BITMAP_SECTORS = divro(SECTOR_BITMAP_SIZE, SECTORSIZE)
# vhd-util has a bug that pads an additional 7 sectors on to each bloc
# at the end.  I suspect this is due to miscalculating the size of the
# bitmap.  Specifically, forgetting to divide the number of bits by 8.
BLOCK_PAD_SECTORS = 7 # Bug for bug compat with vhd-util


class Vhd:
    def __init__(self, path):
        print ('new VHD', path)
        self.path = path
        print(path, self.path)
        self.file = open(self.path, 'rb')
        self.footer = self.file.read(512)
        self.parsedFooter = struct.unpack(">8sIIQI4sIIQQHBBII16sB427s", self.footer)
        self.file.seek(self.parsedFooter[3])
        self.header  = self.file.read(1024)
        self.parsedHeader = struct.unpack(">8sQQIIII16sII512s192s256s", self.header)

        batOffset = self.parsedHeader[2]
        print('batOffset',batOffset)
        self.file.seek(batOffset)
        batLength = self.parsedHeader[4]
        print('batlnght',batLength)
        
        self.file.seek(batOffset)
        bat = self.file.read(batLength*4)
        self.bat= []

        for blockIndex in range(0,batLength) :
            offset = struct.unpack_from('>I', bat, blockIndex * 4)[0]
            self.bat.append(offset)


        #result = subprocess.Popen(['vhd-tool', 'get', path,'parent-unicode-name'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        #stdout, stderr = result.communicate()
        #parentUnicodeName = stdout.strip()    
        parentUnicodeName = self.parsedHeader[10].decode("utf-16-be").rstrip('\x00').encode('utf-8')
        print('parentUnicodeName',parentUnicodeName)
        if parentUnicodeName:
            parentPath = os.path.join(os.path.dirname(path), parentUnicodeName)
            print('got parent', parentUnicodeName, parentPath)
            print(parentUnicodeName)
            self.parent = Vhd(parentPath)
        else:
            print('found root')
            self.parent = None
    
    def containsBlocks(self, index):
        return self.bat[index] != 0xffffffff or ( self.parent and self.parent.containsBlocks(index) )

    def getBlockData(self, index):
        offset = self.bat[index]
        if offset == 0xffffffff:
            #print('empty in this vhd')
            if self.parent:
                #print('check in parent')
                return self.parent.getBlockData(index)
            else:
                #print('empty in root')
                return None
        else:
            #print('found in', os.path.basename(self.path), index, "at", offset*512)
            self.file.seek(offset*512)
            return self.file.read(2*1024 *1024 + 512)

    def getRoot(self):
        if self.parent:
           return self.parent.getRoot() 
        return self


    def writeTo(self, socket):
        root = self.getRoot()
        print('writeTo', root)   
        
        footer = bytearray(self.footer[:])
        header = bytearray(self.header[:])
        bat = self.bat[:]
        # write child  footer but with root diskType
        
        struct.pack_into(">I", footer, 60, struct.unpack_from(">I",root.footer, 60)[0])
        # todo : checksum 
        struct.pack_into(">I", footer, 64, 0 )
        struct.pack_into('>I', footer, 64, (vhd_checksum(footer)))
        socket.send(footer)


        # write child header but with root parentTimestamp,parentUnicodeName,parentUuid
        header = header[0:40] +  root.header[40: 558] + header[558:]
        # todo checksum 
        struct.pack_into(">I", header, 36, 0 ) 
        struct.pack_into('>I', header, 36, (vhd_checksum(header)))
        socket.send(header)

        # write BAT aligned with 512bytes sector

        offset = 1024 + 512  + len(bat) * 4 + 5120
        offsetSector = offset/512
        bat = ""
        for blockIndex in range(0, len(self.bat), 1):
            if self.containsBlocks(blockIndex) :
                #print('got block', blockIndex)
                bat += struct.pack(">I", ( offsetSector ) )
                offsetSector += 4*1024 + 1
            else:
                bat += struct.pack(">I", 0xffffffff )

#        add padding to align to 512 bytes
        while len(bat) % 512 !=0:
            bat += struct.pack(">I", ( 0 ) )
        socket.send(bat)
        
        # todo : parent locator 

        # write blocks
        for blockIndex in range(0, len(self.bat), 1):
            data = self.getBlockData(blockIndex)
            # print('will send ', len(data), blockIndex, len(self.bat))
            if data:
                # print(' got data for block ', blockIndex) 
                socket.send(data)

        # write footer again 
        socket.send(footer)
        print('done')





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
#    parser.add_argument("key", help="authent key")
    args = parser.parse_args()

#    root_path = execute_command(args.file_path)
   
    vhd = Vhd(args.file_path)

    client_socket = socket.socket()
    client_socket.connect((args.host, int(args.port)))
    vhd.writeTo(client_socket)
#    send(args.host, args.port, args.key, root_path)

if __name__ == "__main__":
    main()

