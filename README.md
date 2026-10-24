# FrameVAS - Record Lock

![EspoCRM 9.0+](https://img.shields.io/badge/EspoCRM-9.0%2B-2f6bb3)
![PHP 8.3+](https://img.shields.io/badge/PHP-8.3%2B-777bb4)
![Languages](https://img.shields.io/badge/languages-English%20%7C%20Ukrainian-4c9a2a)

**English** | [Українська](README.uk.md)

Record-level edit protection for EspoCRM, controlled by a Boolean field.

Pick a Boolean field such as "Approved" or "Archived" and turn it into a lock. When the field is checked on a record, the record stays visible but becomes read-only for every user who doesn't have the **Edit Locked Records Permission**. Uncheck it, and the usual access rules apply again.

The lock is enforced on the server for every change a user makes, and the user interface hides editing so people aren't offered actions they can't perform.

## Why use it

Many processes end with a record that must stay visible but shouldn't change anymore: an approved request, a closed case, a signed contract, an archived document. Record Lock protects such records from routine editing, while the roles responsible for corrections can still change them.

It works with the entities, fields and roles you already have. Users see the lock right on the record and in lists, and administrators manage it from the Administration panel.

## Features

- Any storable Boolean field of a standard or custom entity can act as a lock field. An entity can have several; a record is locked when any of them is checked.
- For users without the permission, a locked record is read-only. There's no Edit button, no inline editing, no Remove action, no Select or Unlink in relationship panels, and no Edit or Remove in list row menus.
- A **Locked** indicator appears next to the record's action buttons. Clicking it explains which field locked the record and whether you can still edit it.
- Server-side enforcement covers updates, inline edits, unlocking, deletion, linking and unlinking, mass update, mass delete, merge, CSV import and the REST API.
- A new role permission, **Edit Locked Records Permission**, for both roles and portal roles. Administrators can always edit locked records.
- Locked records are protected from removal by default. Removal can be allowed per lock field.
- An **Administration → Record Lock** page to add, change and turn off lock fields. The same setting is available in Entity Manager on each Boolean field.
- When a user locks a record from its form, the view switches to read-only right after saving, without a page reload.
- English and Ukrainian translations.
- Works independently of the built-in lock feature of EspoCRM 10.

## Requirements

- EspoCRM 9.0.0 or newer
- PHP 8.3 or newer

Tested on EspoCRM 9.0.0 and 10.0.10 with PHP 8.3 and MariaDB 10.11.

## Installation

1. Download the latest extension package (`.zip`) from the [Releases](../../releases) page.
2. In EspoCRM, go to **Administration → Extensions**.
3. Click **Upload**, choose the downloaded file and click **Install**.
4. Go to **Administration → Clear Cache**.
5. Reload the page in your browser.

EspoCRM rebuilds the database during installation, which adds the new permission to roles and portal roles.

## Configuration

### 1. Choose a lock field

If the entity doesn't have a suitable field yet, create a Boolean field first (for example "Approved" or "Archived"). Add it to the detail layout so users can check it.

Then make it a lock field in either of two places. Both change the same setting.

- **Administration → Record Lock.** Under **Add a lock field**, choose the entity and the Boolean field, then click **Add lock field**. The **Lock fields** table lists every lock field in the system, with buttons to allow or block removal and to turn the lock off.
- **Administration → Entity Manager → (entity) → Fields → (Boolean field).** Check **Lock Record** and save.

### 2. Decide whether locked records can be removed

By default, locked records can't be removed. To allow removal by users who have delete access, check **Allow Removal When Locked** on the field, or click **Allow removal** in the Record Lock table.

### 3. Grant the permission to the right roles

Open **Administration → Roles**, edit a role and set **Edit Locked Records Permission** to `yes`. For portal users, do the same in **Administration → Portal Roles**.

Users without a role that sets this permission to `yes` can't change locked records. Administrators always can.

## How it works

### Users without the permission

On a locked record:

- the record is shown as usual, and users can still comment in the stream;
- the Edit button, inline-edit pencils and the Remove action are hidden;
- relationship panels don't offer Select or Unlink;
- the **Locked** indicator is shown;
- in list views, the row menu of a locked record has no Edit or Remove;
- opening the edit page directly, for example from a bookmark, shows the form read-only, without Save, and with a notice that the record is locked.

### Users with the permission, and administrators

The record behaves as usual. The **Locked** indicator is still shown so everyone knows the record is locked.

### Locking and unlocking

Anyone who can edit a record can lock it, even in the same save as other changes. Once it's locked, only users with the permission can unlock it.

The lock state always comes from the saved record. Sending the lock field as unchecked doesn't unlock a record for someone without the permission.

### On the server

For users without the permission, the server refuses (HTTP 403) to:

- update a locked record, including inline edits and attempts to unlock it;
- remove a locked record, unless removal is allowed for that lock field;
- link or unlink related records from a locked record;
- merge a locked record, whether it's the target or one of the duplicates.

Mass update, mass delete and CSV import (create and update) skip locked records and process the rest.

The lock state is loaded together with every list, so list views and relationship panels know which records are locked even when the lock field isn't shown as a column.

### Automation

Automation set up by an administrator isn't blocked by the lock. This includes workflows, formula scripts, BPM processes and scheduled jobs. This follows EspoCRM's general rule that automation isn't subject to user access rights.

## Notes and limitations

- **Referencing a locked record.** Other records can still refer to a locked record without changing it. Examples: creating a contact under a locked account, or adding a locked account to a contact's Accounts field. EspoCRM only requires read access for this, and the locked record's own data doesn't change.
- **Who may lock.** To limit which users can lock records, use field-level security on the lock field in Roles.
- **Duplicating.** Duplicating a locked record copies the lock field, so the copy is locked too.
- **API responses.** API clients get the standard `403` response for a locked record, not a lock-specific message.
- **EspoCRM 10 built-in lock.** EspoCRM 10 has its own lock feature (Lock and Unlock actions with the `isLocked` field), which blocks everyone until unlocked. This extension works independently of it and doesn't offer `isLocked` as a lock field. Both can be used on the same entity.
- **Other extensions.** The server-side check plugs into EspoCRM's access checker factory. Another extension that replaces the same factory would conflict with this one.

## Uninstalling

Go to **Administration → Extensions**, find **FrameVAS - Record Lock** and click **Uninstall**. Or from the command line:

The lock stops working immediately. Lock field settings and role permission values are kept, so reinstalling restores the previous configuration. The `record_lock_permission` columns remain in the role tables and do no harm.

## Translations

English and Ukrainian are included. To add a language, copy `/files/custom/Espo/Modules/RecordLock/Resources/i18n/en_US` to a folder with the EspoCRM language code (e.g. `de_DE`), translate the values (keep keys and placeholders like `{user}` unchanged) and clear the cache.
