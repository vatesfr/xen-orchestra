```ts
 vTPM Object
 {
  uuid: string,
 }
```

vTPM features are only enabled if XAPI is recent enough (`pool.restrictions.restrict_vtpm === 'false'`).

- vTPM
  - At VM creation
    - A toggle labeled _enable vTPM_ will be displayed in advanced settings under `boot firmware`.
    - An informative icon that redirects the user to a vTPM documentation will be displayed right after the label.
    - The default value is `false`, except if `template.platform.vtpm` is `"true"`.
      - A message will be displayed below the toggle if:
        - The value is `false` and the `template.platform.vtpm` is `"true"`: _This template requires a vTPM, if you proceed, the VM will likely not be able to boot_
    - The toggle is disabled if XAPI is not recent enough or if `boot firmware` is not `UEFI`.
      - If disabled, a tooltip will be displayed:
        - If XAPI is not recent enough: _vTPM support is only available on pools running XCP-ng/XS 8.3 or later._
        - If `boot firmware` is not `UEFI`: _A UEFI boot firmware is necessary to use a vTPM_
  - VM advanced tab
    - A new field labeled _vTPM_ will be created in the `Xen settings` just under `bios firmware`.
    - An informative icon that redirects the user to a vTPM documentation will be displayed right after the label.
    - If no vTPM is attached to the current VM:
      - A button labeled _Create a vTPM_ will be displayed.
      - The button is disabled if XAPI is not recent enough or if `boot firmware` is not `UEFI`.
        - If disabled, a tooltip will be displayed:
          - If XAPI is not recent enough: _vTPM support is only available on pools running XCP-ng/XS 8.3 or later._
          - If `boot firmware` is not `UEFI`: _A UEFI boot firmware is necessary to use a vTPM_
    - If vTPM is attached to the current VM:
      - A button labeled _Delete the vTPM_ will be displayed.
      - The button will trigger a confirmation modal wich warn the user: _If the vTPM is in use, removing it will result in a dangerous data loss. Are you sure you want to remove the vTPM?_
      - Above the button, the following information will be displayed:
        - vTPM UUID: sliced UUID (as we do for backup ID or others, only 4 characters will be displayed and a copy to clipboard button will be available)
