from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import SessionLocal
from app.db_models import ScanProfile
from app.discovery_runtime import execute_and_persist_scan


class DiscoveryScheduler:
    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler(timezone="UTC")

    def start(self) -> None:
        if not self.scheduler.running:
            self.scheduler.start()

    def shutdown(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    async def _run_profile(self, profile_id: int) -> None:
        db = SessionLocal()
        try:
            profile = db.query(ScanProfile).filter(ScanProfile.id == profile_id).first()
            if not profile or not profile.is_enabled:
                return
            await execute_and_persist_scan(db, profile, triggered_by="scheduler")
        finally:
            db.close()

    def sync_jobs(self) -> None:
        if not self.scheduler.running:
            return

        db = SessionLocal()
        try:
            profiles = db.query(ScanProfile).filter(ScanProfile.is_enabled.is_(True)).all()
            active_job_ids = set()

            for profile in profiles:
                job_id = f"scan-profile-{profile.id}"
                active_job_ids.add(job_id)
                self.scheduler.add_job(
                    self._run_profile,
                    "interval",
                    minutes=profile.schedule_minutes,
                    id=job_id,
                    replace_existing=True,
                    args=[profile.id],
                    max_instances=1,
                    coalesce=True,
                )

            for job in self.scheduler.get_jobs():
                if job.id.startswith("scan-profile-") and job.id not in active_job_ids:
                    self.scheduler.remove_job(job.id)
        finally:
            db.close()


discovery_scheduler = DiscoveryScheduler()
