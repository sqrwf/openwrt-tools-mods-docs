# luci-app-samba4 Modification

## Rationale

For quite some time, the "shared directories" table with `luci-app-samba4` has been a pet peeve of mine. Not only does it try to display shares in one unwieldly, crampled table for each share, it also expects edits to be made there, and is virtually impossible to extend with further options. This modification tries to remedy all these problems.

## Modifications

- Complete overhaul of the luci-app-samba4 web interface
- Shares are organized in an editable and sortable table with a modal dialog for each share
- Adds options for *read-only* and *read/write* users
- Changes file/directory masks to sensible, secure defaults
- Adds descriptions for clarity, and changes descriptions where the original was confusing or outright wrong

## Screenshots

![Screenshot](./screenshot_1.png?raw=true)
![Screenshot](./screenshot_2.png?raw=true)
![Screenshot](./screenshot_3.png?raw=true)
![Screenshot](./screenshot_4.png?raw=true)

## Prerequisites

- `luci-app-samba4` with all its dependencies

## Usage

- Overwrite original files with the file(s) from this repository

## Notes

- Changing labels or descriptions inevitably breaks translations.
- I disagree with Samba-on-OpenWrt's default file/directory masks of 0666 and 0777 respectively (which, unlike the original source code says, are *not* Samba's defaults). Users should be taught about permission management, not be presented with the loosest possible permission masks in hopes they don't run into problems with their configurations.

## Why Isn’t Any of This Upstream?

I tried to gauge interest in the OpenWrt Forums and received virtually no feedback. Either it went largely unnoticed, noone is actually using the horrible original web interface, or other people's tolerance for pain is higher than mine.

This directory is part of the [*OpenWrt Tools, Modifications, and Documentation*](https://github.com/sqrwf/openwrt-tools-mods-docs) collection repository. For more context, check the repository’s README.