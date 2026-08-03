from sqlalchemy.orm import Session
from backend.app.models.all_models import ActivityLog, Notification

def log_activity(db: Session, user_id: str, action: str, details: str):
    """Utility function to append audit logs to the ActivityLog table."""
    try:
        activity = ActivityLog(user_id=user_id, action=action, details=details)
        db.add(activity)
        db.commit()
    except Exception as e:
        print(f"Error logging activity: {e}")
        db.rollback()

def send_match_notifications(db: Session, user_id: str, title: str, message: str, match_id: str = None, item_id: str = None):
    """Creates in-app notification record and simulates real-time email dispatch."""
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            match_id=match_id,
            item_id=item_id,
            is_read=False
        )
        db.add(notification)
        db.commit()
        # Simulated SMTP email dispatch output:
        print(f"EMAIL NOTIFICATION SENT to User [{user_id}]: {title} - {message}")
    except Exception as e:
        print(f"Error sending notification: {e}")
        db.rollback()
