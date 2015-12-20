# Continuous Replication

> This feature is currently under active development.

Thanks to use of delta disks and VM streaming, we can provide a way to stream very often (ie continuously) disks to a remote pool.

Unlike DR which is using a lot of bandwidth and can only be achieved sometimes, you can plan a replication every hour (and even every minute).

If you lose your main pool, you can start the copy on the other side, with very recent data.

> Warning: only work on a clone of the copied VM. Indeed, you must avoid using directly this VM: as soon you'll start it, and if the diff continue to work, you can damage it.