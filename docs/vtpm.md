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

vTPM features are only enabled if XAPI is recent enough (check for `pool.restrict` or version (>= 8.3)). _((Samuel: exact check to be defined))_

- vTPM
  - At VM creation
    - A toggle will be displayed in advanced settings under `boot firmware`. _((Samuel: TODO define label of this toggle. Something like "Attach a vTPM to the VM", or just "vTPM"? We also probably need to define a tooltip for this label - or other means through which you provide explanations to users in XO - to explain what it is))_
    - The default value is `false`, except for Windows >= W11. \*((Samuel: we now know what the exact check is. It's defined in the template: ))
      - A message will be displayed below the toggle if:
        - The value is `true`: _Please note that once the vTPM is used, its deletion is strongly discouraged as it will lead to data loss._
        - The value is `false` and the VM is a Windows 11 or later: _VMs under Windows 11 or later cannot be created without vTPM_
    - The toggle is disabled if XAPI is not recent enough or if `boot firmware` is not `UEFI`.
      - If disabled, a tooltip will be displayed:
        - If XAPI is not recent enought: _The vTPM support is only available on pool XCP-ng/XS 8.3 or later._
        - If `boot firmware` is not `UEFI`: _To use the vTPM, the boot firmware need to be UEFI_
  - VM advanced tab
    - A new section _VTPM_ will be created just under `Xen settings`.
    - If no vTPM is attached to the current VM:
      - A button labeled _Create a vTPM_ will be displayed.
      - The button is disabled if XAPI is not recent enough or if `boot firmware` is not `UEFI`.
        - If disabled, a tooltip will be displayed:
          - If XAPI is not recent enought: _The vTPM support is only available on pool XCP-ng/XS 8.3 or later._
          - If `boot firmware` is not `UEFI`: _To use the vTPM, the boot firmware need to be UEFI_
      - The button will trigger a confirmation modal which warn the user: _Please note that once the vTPM is used, its deletion is strongly discouraged as it will lead to data loss._
    - If vTPM is attached to the current VM:
      - A button labeled _Delete the vTPM_ will be displayed.
      - The button will trigger a confirmation modal wich warn the user: _If the vTPM is in use, removing it will result in a dangerous data loss. This action is irreversible. Are you sure you want to remove the vTPM?_
      - Below the button, the following information will be displayed:
        - vTPM ID: sliced ID (as we do for backup ID or others, only 4 characters will be displayed and a copy to clipboard button will be available)
        - Is unique: boolean (if used)
        - Is protected: boolean (if used)
