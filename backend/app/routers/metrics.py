import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

# Try to import ML libraries to ensure they are available
try:
    import xgboost as xgb
    import sklearn
    HAS_ML = True
except ImportError:
    HAS_ML = False

router = APIRouter()

@router.get("", response_model=List[schemas.HealthMetricResponse])
def get_metrics(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    metrics = db.query(models.HealthMetric).filter(
        models.HealthMetric.user_id == current_user.id
    ).order_by(models.HealthMetric.date.asc()).all()
    return metrics

@router.post("", response_model=schemas.HealthMetricResponse)
def create_metric(
    metric: schemas.HealthMetricCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate BMI if height and weight are available and BMI is not provided
    bmi_val = metric.bmi
    if bmi_val is None:
        profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
        if profile and profile.height and metric.weight:
            # height in cm to meters
            h_m = float(profile.height) / 100.0
            if h_m > 0:
                bmi_val = float(metric.weight) / (h_m * h_m)

    new_metric = models.HealthMetric(
        user_id=current_user.id,
        date=metric.date,
        bmi=bmi_val,
        systolic=metric.systolic,
        diastolic=metric.diastolic,
        blood_sugar=metric.blood_sugar,
        heart_rate=metric.heart_rate,
        weight=metric.weight
    )

    db.add(new_metric)
    db.commit()
    db.refresh(new_metric)
    return new_metric

@router.get("/predictions")
def get_predictions(
    metric_id: Optional[uuid.UUID] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Get health metrics
    if metric_id:
        latest_metric = db.query(models.HealthMetric).filter(
            models.HealthMetric.user_id == current_user.id,
            models.HealthMetric.id == metric_id
        ).first()
    else:
        latest_metric = db.query(models.HealthMetric).filter(
            models.HealthMetric.user_id == current_user.id
        ).order_by(models.HealthMetric.date.desc()).first()

    if not latest_metric:
        return {
            "has_data": False,
            "date": None,
            "diseases": []
        }

    # Default values if metrics exist
    bmi = float(latest_metric.bmi) if latest_metric.bmi else 22.0
    systolic = latest_metric.systolic if latest_metric.systolic else 120
    diastolic = latest_metric.diastolic if latest_metric.diastolic else 80
    blood_sugar = float(latest_metric.blood_sugar) if latest_metric.blood_sugar else 95.0
    heart_rate = latest_metric.heart_rate if latest_metric.heart_rate else 75

    # Compute age
    age = 35
    if profile.date_of_birth:
        today = date.today()
        age = today.year - profile.date_of_birth.year - (
            (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day)
        )

    # Heuristic AI Model simulating predictions that would be outputted by trained XGBoost models.
    # 1. Diabetes risk
    diabetes_risk = 10
    if blood_sugar > 100:
        diabetes_risk += (blood_sugar - 100) * 1.5
    if bmi > 25:
        diabetes_risk += (bmi - 25) * 2.0
    if age > 45:
        diabetes_risk += 15
    diabetes_risk = min(int(diabetes_risk), 95)

    # 2. Hypertension risk
    hypertension_risk = 15
    if systolic > 120:
        hypertension_risk += (systolic - 120) * 1.2
    if diastolic > 80:
        hypertension_risk += (diastolic - 80) * 1.5
    if bmi > 25:
        hypertension_risk += (bmi - 25) * 1.0
    hypertension_risk = min(int(hypertension_risk), 95)

    # 3. Cardiovascular risk
    cardio_risk = 8
    if systolic > 130 or diastolic > 85:
        cardio_risk += 20
    if heart_rate > 85:
        cardio_risk += (heart_rate - 85) * 1.0
    if bmi > 27:
        cardio_risk += 15
    if age > 50:
        cardio_risk += 20
    cardio_risk = min(int(cardio_risk), 95)

    # Compile recommendations
    diabetes_recs = ["Hạn chế đường và tinh bột tinh chế", "Tập thể dục ít nhất 150 phút mỗi tuần"]
    if diabetes_risk >= 50:
        diabetes_recs.append("Theo dõi đường huyết thường xuyên và tư vấn bác sĩ chuyên khoa")

    hypertension_recs = ["Giảm lượng muối trong chế độ ăn hàng ngày", "Tránh căng thẳng và ngủ đủ giấc"]
    if hypertension_risk >= 50:
        hypertension_recs.append("Đo huyết áp hàng ngày và kiểm tra y tế định kỳ")

    cardio_recs = ["Duy trì chế độ ăn tốt cho tim mạch (nhiều rau xanh, cá)", "Hạn chế rượu bia, thuốc lá"]
    if cardio_risk >= 50:
        cardio_recs.append("Khám tim mạch chuyên sâu để kiểm tra điện tâm đồ hoặc siêu âm tim")

    return {
        "has_data": True,
        "date": date.today().strftime("%d/%m/%Y"),
        "has_ml_backend": HAS_ML,
        "diseases": [
            {
                "id": "diabetes",
                "name": "Tiểu đường (Diabetes)",
                "risk": diabetes_risk,
                "description": "Bệnh rối loạn chuyển hóa carbonhydrat khi hormone insulin của tụy bị thiếu hụt.",
                "recommendations": diabetes_recs
            },
            {
                "id": "hypertension",
                "name": "Cao huyết áp (Hypertension)",
                "risk": hypertension_risk,
                "description": "Tình trạng áp lực máu đẩy vào thành động mạch quá cao khi tim bơm máu.",
                "recommendations": hypertension_recs
            },
            {
                "id": "cardiovascular",
                "name": "Bệnh tim mạch (Cardiovascular)",
                "risk": cardio_risk,
                "description": "Các tình trạng liên quan đến sức khỏe của trái tim và sự hoạt động của các mạch máu.",
                "recommendations": cardio_recs
            }
        ]
    }
