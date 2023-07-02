# Deduplication

- This this use a additionnal inode (or equivalent on the FS), for each different block in the xo-block-store`sub folder`
- This will not work well with immutabilty/object lock
- only dedup blocks of vhd directory
- prerequisite are : the fs must support hard link and extended attributes
- a key (full backup) does not take more space on te remote than a delta. It will take more inodes , and more time since we'll have to read all the blocks. T

When a new block is written to the remote, a hash is computed. If a file with this hash doesn't exists in xo-block-store` create it, then add the has as an extended attributes.
A link hard link, sharing data and extended attributes is then create to the destination

When deleting a block which has a hash extended attributes, a check is done on the xo-block-store. If there are no other link, then the block is deleted . The directory containing it stays

When merging block : the unlink method is called before overwriting an existing block

### troubleshooting

Since all the blocks are hard linked, you can convert a deduplicated remote to a non deduplicated one by deleting the xo-block-store directory

two new method has been added to the local fs handler :

- deduplicationGarbageCollector(), which should be called from the root of the FS : it will clean any block without other links, and any empty directory
- deduplicationStats() that will compute the number of blocks in store and how many times they are used
