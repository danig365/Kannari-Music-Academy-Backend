# Backups & Restore — Kannari Music Academy

## What is backed up
The `backup_data` management command writes three timestamped files to `./backups/`
(host-visible, bind-mounted into the `backend` and `scheduler` containers at `/app/backups`):

| Path | Contents |
|------|----------|
| `db_<ts>.sql.gz` | Full Postgres dump (`pg_dump`) — the authoritative restore source. All lesson content, YouTube links, users, subscriptions, progress. Integrity-checked after each dump. |
| `media/<ts>/` | Space-efficient snapshot of `MEDIA_ROOT` (rsync `--link-dest`). Each dated folder is a full, browsable copy of the uploads, but files unchanged since the previous snapshot are **hard-linked** — so a week of media costs ~one copy + the week's changes, not 7×. |
| `lessons_<ts>.json.gz` | Human-readable export of every lesson's content + YouTube links. A safety net you can read/grep even without restoring the DB. |

## Schedule & retention
Runs automatically once a day at **09:00 UTC** via the `scheduler` container
(`docker-compose.yml`). Retention is split because media is huge and DB dumps are tiny:
- **Media snapshots + everything: 7 days** (`--keep-days 7`)
- **DB dumps + lesson JSON: 30 days** (`--db-keep-days 30`, cheap point-in-time history)

If any step fails (or a DB dump is corrupt/too small), active admins get an email alert
and the command exits non-zero.

## Run manually
```bash
docker exec html-backend-1 python manage.py backup_data              # keep 14 days
docker exec html-backend-1 python manage.py backup_data --keep-days 30
docker exec html-backend-1 python manage.py backup_data --no-media   # DB + lesson JSON only
```
Files appear in `./backups/` on the host.

## Restore

> ⚠️ Restoring the database **overwrites current data**. Take a fresh backup first
> (`backup_data`) and ideally test the restore on a staging copy.

### 1. Database
```bash
# Copy the dump into the db container (or use the mounted path)
gunzip -c backups/db_<ts>.sql.gz > /tmp/restore.sql
docker exec -i html-db-1 psql -U postgres -d postgres < /tmp/restore.sql
# (use the DB name/user from backend/.env DATABASE_URL if different)
```
For a clean restore into an empty DB, drop & recreate the database first, then load.

### 2. Uploaded media
Each `media/<ts>/` folder is already a full copy of the uploads — just sync a chosen
snapshot back into the media volume:
```bash
docker run --rm -v html_media_data:/app/media -v "$PWD/backups":/backups alpine \
  sh -c "apk add --no-cache rsync >/dev/null && rsync -a --delete /backups/media/<ts>/ /app/media/"
```
(Volume name may be `html_media_data` — check `docker volume ls`. Drop `--delete` if you
only want to add missing files rather than mirror exactly.)

### 3. Verify
- Log in, open a course, confirm lessons/videos load.
- `lessons_<ts>.json.gz` can be inspected directly:
  `gunzip -c backups/lessons_<ts>.json.gz | less`

## Off-site copies (not yet enabled)
The client chose **local-first**. The command has an off-site hook
(`_upload_offsite`) that is a no-op until a destination is configured. To enable it
later (S3 / Backblaze / rclone), implement the upload in that method and set
`BACKUP_OFFSITE_TARGET` in `backend/.env`. Until then, copy `./backups/` off the
server periodically (e.g. `rsync`/`scp`) so the server isn't a single point of failure.
