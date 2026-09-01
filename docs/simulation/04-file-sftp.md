# Simulation Scenario 04: Files, Drop Box & SFTP Transfers Simulation

Simulates write-only drop box receiver (`tailcat recv /inbox`) and SFTP directory server (`tailcat serve files`) with `tailcat cp` and `tailcat ls`.

---

## Step-by-Step Visual Walkthrough

### Step 1: Start Drop Box Inbox Receiver

![Step 1: Start Drop Box Inbox Receiver](../../screenshots/simulation/04-file-sftp/dropbox-inbox-listen/01-dropbox-inbox-listen.webp)

---

### Step 2: Client Copies File into Drop Box

![Step 2: Client Copies File into Drop Box](../../screenshots/simulation/04-file-sftp/dropbox-file-upload/02-dropbox-file-upload.webp)

---

### Step 3: Serve SFTP Files Directory

![Step 3: Serve SFTP Files Directory](../../screenshots/simulation/04-file-sftp/sftp-directory-serve/03-sftp-directory-serve.webp)

---

### Step 4: Client Explores & Downloads File

![Step 4: Client Explores & Downloads File](../../screenshots/simulation/04-file-sftp/sftp-list-download/04-sftp-list-download.webp)


---

## Automated Execution
Run this individual scenario in the test environment:
```bash
./scripts/simulate.sh --scenario 04
```
