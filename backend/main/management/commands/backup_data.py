"""
Create a backup of the platform's data so lesson content, uploaded files, and
video links can be recovered if anything is lost.

Layout under the backup directory (default /app/backups):

  db_<ts>.sql.gz        Full Postgres dump (pg_dump) — authoritative restore source.
                        (Falls back to copying db.sqlite3 in local/dev SQLite mode.)
  lessons_<ts>.json.gz  Human-readable export of every lesson's content + YouTube links.
  media/<ts>/           Space-efficient snapshot of MEDIA_ROOT via rsync --link-dest:
                        each day is a full browsable snapshot, but files unchanged
                        since the previous snapshot are HARD-LINKED, so seven days of
                        media cost roughly one copy + the week's changes, not 7×.

Retention (independent, because media is huge and the DB dump is tiny):
  --keep-days      media snapshots + how far back to keep everything (default 7)
  --db-keep-days   db_*.sql.gz + lessons_*.json.gz (default 30 — cheap history)

Safety:
  * Each DB dump is integrity-checked (gzip readable + not suspiciously small).
  * If ANY step fails, active admins get an email alert and the command exits non-zero.

Client chose LOCAL-ONLY (no off-site). To add off-site later, upload the files in
_upload_offsite (gated on BACKUP_OFFSITE_TARGET).

RESTORE: see backend/BACKUP_RESTORE.md.
"""
import gzip
import json
import os
import subprocess
from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from main import models

MIN_DB_BYTES = 1024  # a healthy gzipped dump is far bigger; smaller ⇒ something broke


class Command(BaseCommand):
    help = "Back up the database, uploaded media (incremental), and lesson content/video links."

    def add_arguments(self, parser):
        parser.add_argument('--keep-days', type=int, default=7,
                            help='Retention for media snapshots / everything (default 7).')
        parser.add_argument('--db-keep-days', type=int, default=30,
                            help='Retention for db_*.sql.gz + lessons_*.json.gz (default 30).')
        parser.add_argument('--no-media', action='store_true',
                            help='Skip the media snapshot (DB + lesson JSON only).')
        parser.add_argument('--quiet', action='store_true', help='Only print warnings/errors.')

    def handle(self, *args, **opts):
        self.quiet = opts['quiet']
        backup_dir = os.getenv('BACKUP_DIR', '/app/backups')
        os.makedirs(backup_dir, exist_ok=True)
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        errors, made = [], []

        self._log(f"[backup] starting — dir={backup_dir} ts={ts}")

        # 1) Database (+ integrity check)
        try:
            path = self._dump_database(backup_dir, ts)
            self._verify_db(path)
            made.append(path)
        except Exception as e:
            errors.append(f"DB dump: {e}")
            self.stderr.write(f"[backup] DB dump FAILED: {e}")

        # 2) Media — incremental hard-linked snapshot
        if not opts['no_media']:
            try:
                made.append(self._snapshot_media(backup_dir, ts))
            except Exception as e:
                errors.append(f"media snapshot: {e}")
                self.stderr.write(f"[backup] media snapshot FAILED: {e}")

        # 3) Lesson content + video links (human-readable safety net)
        try:
            made.append(self._export_lessons(backup_dir, ts))
        except Exception as e:
            errors.append(f"lesson export: {e}")
            self.stderr.write(f"[backup] lesson export FAILED: {e}")

        made = [m for m in made if m]
        for path in made:
            self._upload_offsite(path)

        # 4) Prune (media/everything by keep-days; db+lessons kept longer)
        try:
            self._prune(backup_dir, opts['keep_days'], opts['db_keep_days'])
        except Exception as e:
            errors.append(f"prune: {e}")
            self.stderr.write(f"[backup] prune FAILED: {e}")

        # 5) Report / alert
        if errors:
            self._alert_admins(ts, errors)
            self.stderr.write(self.style.ERROR(f"[backup] completed WITH ERRORS: {'; '.join(errors)}"))
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS(
            f"[backup] OK — {len(made)} artifact(s) in {backup_dir} (media kept "
            f"{opts['keep_days']}d, db kept {opts['db_keep_days']}d)"))

    # ── steps ────────────────────────────────────────────────────────────────
    def _dump_database(self, backup_dir, ts):
        db = settings.DATABASES['default']
        if 'sqlite' in db.get('ENGINE', ''):
            out = os.path.join(backup_dir, f'db_{ts}.sqlite3.gz')
            with open(db['NAME'], 'rb') as f_in, gzip.open(out, 'wb') as f_out:
                for chunk in iter(lambda: f_in.read(1 << 16), b''):
                    f_out.write(chunk)
            self._log(f"[backup] sqlite copied -> {os.path.basename(out)}")
            return out

        out = os.path.join(backup_dir, f'db_{ts}.sql.gz')
        cmd = [
            'pg_dump', '--no-owner', '--no-privileges',
            '-h', str(db.get('HOST') or 'localhost'),
            '-p', str(db.get('PORT') or '5432'),
            '-U', str(db.get('USER') or 'postgres'),
            '-d', str(db.get('NAME') or ''),
        ]
        env = {**os.environ, 'PGPASSWORD': str(db.get('PASSWORD') or '')}
        with gzip.open(out, 'wb') as gz:
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
            for chunk in iter(lambda: proc.stdout.read(1 << 16), b''):
                gz.write(chunk)
            proc.stdout.close()
            err = proc.stderr.read().decode(errors='replace')
            if proc.wait() != 0:
                raise RuntimeError(f"pg_dump exit {proc.returncode}: {err.strip()}")
        self._log(f"[backup] pg_dump -> {os.path.basename(out)}")
        return out

    def _verify_db(self, path):
        """Fail loudly if the dump is unreadable or suspiciously small."""
        size = os.path.getsize(path)
        if size < MIN_DB_BYTES:
            raise RuntimeError(f"dump too small ({size} bytes) — likely incomplete")
        with gzip.open(path, 'rb') as f:      # raises if gzip is corrupt/truncated
            f.read(1 << 16)
        self._log(f"[backup] db integrity OK ({size/1024:.0f} KB)")

    def _snapshot_media(self, backup_dir, ts):
        media_root = str(settings.MEDIA_ROOT).rstrip('/')
        if not os.path.isdir(media_root):
            self._log(f"[backup] media dir missing ({media_root}), skipping")
            return None
        media_dir = os.path.join(backup_dir, 'media')
        os.makedirs(media_dir, exist_ok=True)
        dest = os.path.join(media_dir, ts)

        # Hard-link unchanged files against the most recent previous snapshot.
        prev = sorted(d for d in os.listdir(media_dir)
                      if os.path.isdir(os.path.join(media_dir, d)))
        link_args = ['--link-dest', os.path.join(media_dir, prev[-1])] if prev else []
        cmd = ['rsync', '-a', '--delete'] + link_args + [media_root + '/', dest + '/']
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(f"rsync exit {proc.returncode}: {proc.stderr.strip()}")
        self._log(f"[backup] media snapshot -> media/{ts}/"
                  + (f" (linked to {prev[-1]})" if prev else " (first full)"))
        return dest

    def _export_lessons(self, backup_dir, ts):
        data = []
        qs = models.ModuleLesson.objects.select_related('module', 'module__course').all()
        for l in qs:
            module = l.module
            course = module.course if module else None
            data.append({
                'lesson_id': l.id, 'title': l.title, 'description': l.description,
                'content_type': l.content_type, 'youtube_url': l.youtube_url,
                'file': l.file.name if l.file else None, 'objectives': l.objectives,
                'order': l.order,
                'module_id': module.id if module else None,
                'module_title': module.title if module else None,
                'course_id': course.id if course else None,
                'course_title': course.title if course else None,
            })
        out = os.path.join(backup_dir, f'lessons_{ts}.json.gz')
        with gzip.open(out, 'wt', encoding='utf-8') as gz:
            json.dump({'exported_at': timezone.now().isoformat(),
                       'lesson_count': len(data), 'lessons': data},
                      gz, ensure_ascii=False, indent=2)
        self._log(f"[backup] lessons ({len(data)}) -> {os.path.basename(out)}")
        return out

    def _prune(self, backup_dir, keep_days, db_keep_days):
        now = timezone.now().timestamp()
        removed = 0

        # DB dumps + lesson JSON — kept longer (cheap).
        db_cutoff = now - db_keep_days * 86400
        for name in os.listdir(backup_dir):
            if name.startswith(('db_', 'lessons_', 'media_')):   # 'media_' = legacy tar
                path = os.path.join(backup_dir, name)
                if os.path.isfile(path) and os.path.getmtime(path) < db_cutoff:
                    os.remove(path)
                    removed += 1

        # Media snapshots — kept keep_days. Deleting a snapshot only drops its
        # hard-links; bytes still referenced by newer snapshots survive.
        # NOTE: prune by the TIMESTAMP IN THE FOLDER NAME, not mtime — `rsync -a`
        # copies the source dir's mtime onto the snapshot, so mtime is unreliable.
        media_dir = os.path.join(backup_dir, 'media')
        if os.path.isdir(media_dir):
            import shutil
            media_cutoff_dt = datetime.now() - timedelta(days=keep_days)
            for name in os.listdir(media_dir):
                path = os.path.join(media_dir, name)
                if not os.path.isdir(path):
                    continue
                try:
                    snap_dt = datetime.strptime(name, '%Y%m%d_%H%M%S')
                except ValueError:
                    continue  # not a snapshot folder — leave it alone
                if snap_dt < media_cutoff_dt:
                    shutil.rmtree(path, ignore_errors=True)
                    removed += 1

        if removed:
            self._log(f"[backup] pruned {removed} old item(s)")

    def _alert_admins(self, ts, errors):
        try:
            admins = list(models.Admin.objects.filter(is_active=True)
                          .exclude(email='').values_list('email', flat=True))
            if not admins:
                return
            from_email = os.getenv('EMAIL_HOST_USER') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@kannari.local')
            body = ("A scheduled Kannari backup did NOT complete cleanly.\n\n"
                    f"Timestamp: {ts}\n\nProblems:\n- " + "\n- ".join(errors) +
                    "\n\nPlease check the server backups directory and the scheduler logs.")
            send_mail("⚠️ Kannari backup FAILED", body, from_email, admins, fail_silently=True)
            self._log(f"[backup] alerted {len(admins)} admin(s)")
        except Exception as e:
            self.stderr.write(f"[backup] could not send alert email: {e}")

    def _upload_offsite(self, path):
        """No-op until a destination is configured (client chose local-only)."""
        target = os.getenv('BACKUP_OFFSITE_TARGET')
        if target:
            self._log(f"[backup] off-site target set ({target}) but upload not implemented")

    def _log(self, msg):
        if not self.quiet:
            self.stdout.write(msg)
