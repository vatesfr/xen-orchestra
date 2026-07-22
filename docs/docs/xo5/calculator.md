---
title: Backup retention calculator
---

import LtrBackupCalculator from '@site/src/components/LtrBackupCalculator'

<LtrBackupCalculator />

:::info Assumptions

- One restore point per backup run (the default is one run per day).
- Week and month boundaries are approximated, and the full-backup count depends slightly on where "today" falls inside a full-backup cycle. When that matters, the calculator shows the **range**.
  :::
