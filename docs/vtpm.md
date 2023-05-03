```ts
 vTPM Object
 {
  id: string,
  is_protected: boolean, // Currently unused by the XAPI, may be used in future.
  is_unique: boolean // Currently unused by the XAPI, may be used in future.
 }
```

- `is_protected`: The TPM is encrypted whenever it's transferred or at stored to disk (and exported)
- `is_unique`: The TPM contents are exclusive to that VM, that means it has never been cloned (and maybe never exported nor imported)

vTPM features are only enabled if XAPI is recent enough (check for version >= 8.3).

- vTPM
  - At VM creation
    - A toggle will be displayed in advanced settings under `boot firmware`.
    - The default value is `false`, except if `template.platform.vtpm` is `"true"`.
      - A message will be displayed below the toggle if:
        - The value is `true`: _Please note that once the vTPM is used, its deletion is strongly discouraged as it will lead to data loss._
        - The value is `false` and the `template.platform.vtpm` is `"true"`: _The VM cannot be created without vTPM_
    - The toggle is disabled if XAPI is not recent enough or if `boot firmware` is not `UEFI`.
      - If disabled, a tooltip will be displayed:
        - If XAPI is not recent enough: _vTPM support is only available on pools running XCP-ng/XS 8.3 or later._
        - If `boot firmware` is not `UEFI`: _A UEFI boot firmware is necessary to use a vTPM_
  - VM advanced tab
    - A new section _vTPM_ will be created just under `Xen settings`.
    - If no vTPM is attached to the current VM:
      - A button labeled _Create a vTPM_ will be displayed.
      - The button is disabled if XAPI is not recent enough or if `boot firmware` is not `UEFI`.
        - If disabled, a tooltip will be displayed:
          - If XAPI is not recent enough: _vTPM support is only available on pools running XCP-ng/XS 8.3 or later._
          - If `boot firmware` is not `UEFI`: _A UEFI boot firmware is necessary to use a vTPM_
      - The button will trigger a confirmation modal which warn the user: _Please note that once the vTPM is used, its deletion is strongly discouraged as it will lead to data loss._
    - If vTPM is attached to the current VM:
      - A button labeled _Delete the vTPM_ will be displayed.
      - The button will trigger a confirmation modal wich warn the user: _If the vTPM is in use, removing it will result in a dangerous data loss. This action is irreversible. Are you sure you want to remove the vTPM?_
      - Below the button, the following information will be displayed:
        - vTPM ID: sliced ID (as we do for backup ID or others, only 4 characters will be displayed and a copy to clipboard button will be available)
