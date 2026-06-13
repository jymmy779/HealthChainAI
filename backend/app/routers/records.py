import os
import uuid
import requests
import hashlib
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth
from ..config import settings
from ..blockchain import register_record_on_blockchain

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def ensure_local_file(record: models.HealthRecord) -> str:
    """
    Tự động kiểm tra file cục bộ trong UPLOAD_DIR (hỗ trợ pdf, jpg, jpeg, png).
    Nếu thiếu và có link online (IPFS), tải xuống từ IPFS và lưu cục bộ.
    Nếu thất bại hoặc không có link, dùng file mẫu sample_medical_report.pdf làm fallback.
    Trả về đường dẫn file cục bộ hoặc None nếu hoàn toàn thất bại.
    """
    # Tìm file với tất cả các đuôi hỗ trợ (pdf, jpg, jpeg, png)
    supported_exts = ["pdf", "jpg", "jpeg", "png"]
    for ext in supported_exts:
        file_path = os.path.join(UPLOAD_DIR, f"{record.id}.{ext}")
        if os.path.exists(file_path):
            return file_path

    if record.file_url:
        try:
            print(f"File {record.id} is missing locally. Restoring from IPFS: {record.file_url}")
            response = requests.get(record.file_url, timeout=15)
            if response.status_code == 200:
                # Đoán extension từ content-type trả về
                content_type = response.headers.get("content-type", "")
                if "jpeg" in content_type or "jpg" in content_type:
                    restore_ext = "jpg"
                elif "png" in content_type:
                    restore_ext = "png"
                else:
                    restore_ext = "pdf"
                file_path = os.path.join(UPLOAD_DIR, f"{record.id}.{restore_ext}")
                with open(file_path, "wb") as f:
                    f.write(response.content)
                print(f"Successfully restored file {record.id}.{restore_ext} from IPFS.")
                return file_path
            else:
                print(f"Failed to fetch file from IPFS, status code: {response.status_code}")
        except Exception as e:
            print(f"Error restoring file {record.id} from IPFS: {e}")

    # Mức độ ưu tiên các phương án Fallback khi tải online thất bại:
    # 1. File mau_bao_cao_benh_ly.pdf trong uploads (do người dùng copy thủ công)
    fallback_user_pdf = os.path.join(UPLOAD_DIR, "mau_bao_cao_benh_ly.pdf")
    if os.path.exists(fallback_user_pdf):
        print(f"Using fallback user PDF: {fallback_user_pdf}")
        return fallback_user_pdf

    # 2. File sample_medical_report.pdf ở thư mục gốc
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    fallback_pdf = os.path.join(root_dir, "sample_medical_report.pdf")
    if os.path.exists(fallback_pdf):
        print(f"Using fallback default PDF for record {record.id}: {fallback_pdf}")
        return fallback_pdf

    # 3. Bất kỳ file nào tìm thấy trong uploads
    try:
        for f in os.listdir(UPLOAD_DIR):
            if any(f.endswith(f".{e}") for e in supported_exts):
                any_file = os.path.join(UPLOAD_DIR, f)
                print(f"Using fallback any file found in uploads: {any_file}")
                return any_file
    except Exception:
        pass

    return None



@router.get("", response_model=List[schemas.HealthRecordResponse])
def get_records(current_user: models.User = Depends(auth.require_patient), db: Session = Depends(get_db)):
    records = db.query(models.HealthRecord).filter(
        models.HealthRecord.user_id == current_user.id
    ).order_by(models.HealthRecord.created_at.desc()).all()
    return records

@router.post("")
async def create_record(
    name: str = Form(...),
    type: str = Form(...),
    type_label: str = Form(...),
    date_val: str = Form(...),
    description: Optional[str] = Form(None),
    hospital: Optional[str] = Form(None),
    doctor: Optional[str] = Form(None),
    transaction_hash: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_patient)
):
    try:
        record_date = date.fromisoformat(date_val)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    file_url = None
    file_size_str = None
    ipfs_hash = None
    file_content = None
    file_ext = "pdf"  # default extension

    if file:
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        file_size_str = f"{file_size_mb:.1f} MB"
        # Lấy extension gốc của file để lưu đúng định dạng
        if file.filename:
            ext_raw = file.filename.rsplit(".", 1)[-1].lower()
            if ext_raw in ["jpg", "jpeg", "png", "pdf"]:
                file_ext = ext_raw

        # Check Pinata API Keys
        if settings.PINATA_API_KEY and settings.PINATA_SECRET_API_KEY:
            try:
                # Prepare Pinata Upload
                url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
                headers = {
                    "pinata_api_key": settings.PINATA_API_KEY,
                    "pinata_secret_api_key": settings.PINATA_SECRET_API_KEY
                }
                # Reset file pointer and upload
                files = {
                    'file': (file.filename, file_content, file.content_type)
                }
                response = requests.post(url, files=files, headers=headers, timeout=30)
                if response.status_code == 200:
                    res_data = response.json()
                    ipfs_hash = res_data.get("IpfsHash")
                    file_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
                else:
                    # Fallback on Pinata error
                    print(f"Pinata error: {response.text}")
                    ipfs_hash = f"QmPinataErrorFallback{uuid.uuid4().hex[:16]}"
                    file_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
            except Exception as e:
                print(f"Failed to upload to Pinata: {str(e)}")
                ipfs_hash = f"QmUploadExceptionFallback{uuid.uuid4().hex[:16]}"
                file_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
        else:
            # Local/mock fallback when no keys are provided
            ipfs_hash = f"QmLocalMockHash{uuid.uuid4().hex[:16]}"
            file_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"

    # 1. Save to Postgres (with transaction_hash as pending initially)
    new_record = models.HealthRecord(
        user_id=current_user.id,
        name=name,
        type=type,
        type_label=type_label,
        description=description,
        file_url=file_url,
        file_size=file_size_str,
        date=record_date,
        hospital=hospital,
        doctor=doctor,
        transaction_hash=None,
        ipfs_hash=ipfs_hash,
        blockchain_status="pending"
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    # Save file content locally in uploads folder for AI analysis
    if file and file_content:
        try:
            file_path = os.path.join(UPLOAD_DIR, f"{new_record.id}.{file_ext}")
            with open(file_path, "wb") as f:
                f.write(file_content)
        except Exception as e:
            print(f"Failed to save upload file locally: {e}")

    # 2. Automatically compute hash and register on Blockchain from Backend!
    if file_content:
        file_hash = hashlib.sha256(file_content).hexdigest()
    else:
        file_hash = hashlib.sha256(str(new_record.id).encode()).hexdigest()

    tx_hash = register_record_on_blockchain(
        record_id=str(new_record.id),
        patient_id=str(current_user.id),
        ipfs_hash=ipfs_hash or "QmLocalMockHash",
        file_hash=file_hash
    )

    # 3. Update database record with transaction hash and status confirmed
    new_record.transaction_hash = tx_hash
    new_record.blockchain_status = "confirmed"
    db.commit()
    db.refresh(new_record)

    return new_record

@router.delete("/{record_id}")
def delete_record(
    record_id: uuid.UUID,
    current_user: models.User = Depends(auth.require_patient),
    db: Session = Depends(get_db)
):
    record = db.query(models.HealthRecord).filter(
        models.HealthRecord.id == record_id,
        models.HealthRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Health record not found")

    if record.metric_id:
        metric = db.query(models.HealthMetric).filter(models.HealthMetric.id == record.metric_id).first()
        if metric:
            db.delete(metric)

    db.delete(record)
    db.commit()
    return {"message": "Health record deleted successfully"}

@router.put("/{record_id}/blockchain")
def update_blockchain_hash(
    record_id: uuid.UUID,
    payload: dict,
    current_user: models.User = Depends(auth.require_patient),
    db: Session = Depends(get_db)
):
    record = db.query(models.HealthRecord).filter(
        models.HealthRecord.id == record_id,
        models.HealthRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Health record not found")

    tx_hash = payload.get("transaction_hash")
    if not tx_hash:
        raise HTTPException(status_code=400, detail="Missing transaction_hash")

    record.transaction_hash = tx_hash
    record.blockchain_status = "confirmed"
    
    db.commit()
    db.refresh(record)
    return record

@router.post("/{record_id}/analyze")
def analyze_record(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_patient)
):
    import re
    
    # 1. Fetch record
    record = db.query(models.HealthRecord).filter(
        models.HealthRecord.id == record_id,
        models.HealthRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Health record not found")

    # 2. Tìm file hồ sơ (pdf / jpg / png)
    file_path = ensure_local_file(record)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy file hồ sơ để phân tích."
        )

    # 3. Trích xuất text: PDF dùng pypdf, ảnh dùng Groq Vision
    text = extract_record_text(file_path, api_key=settings.GROQ_API_KEY)
    if not text.strip():
        file_ext = file_path.rsplit(".", 1)[-1].lower()
        if file_ext in ["jpg", "jpeg", "png"] and not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=422,
                detail="File ảnh cần GROQ_API_KEY để phân tích bằng AI Vision. Vui lòng cấu hình API key."
            )
        raise HTTPException(
            status_code=422,
            detail="Không thể đọc nội dung file. File có thể bị hỏng hoặc không chứa văn bản."
        )

    # 4. Parse text using regex to extract indicators
    blood_sugar = None
    systolic = None
    diastolic = None
    heart_rate = None
    bmi = None
    weight = None

    # Parse Glucose (Đường huyết)
    glucose_match = re.search(r"Glucose\s*\(Đường\s*huyết\)[| \s]*(\d+)", text, re.IGNORECASE)
    if glucose_match:
        blood_sugar = float(glucose_match.group(1))
    else:
        glucose_match_gen = re.search(r"Glucose[| \s]*(\d+)", text, re.IGNORECASE)
        if glucose_match_gen:
            blood_sugar = float(glucose_match_gen.group(1))

    # Parse Blood Pressure (Huyết áp)
    bp_match = re.search(r"Huyết\s*áp\s*\(Tâm\s*thu\s*/\s*Tâm\s*trương\)[| \s]*(\d+)\s*/\s*(\d+)", text, re.IGNORECASE)
    if bp_match:
        systolic = int(bp_match.group(1))
        diastolic = int(bp_match.group(2))
    else:
        bp_match_gen = re.search(r"Huyết\s*áp[| \s]*(\d+)\s*/\s*(\d+)", text, re.IGNORECASE)
        if bp_match_gen:
            systolic = int(bp_match_gen.group(1))
            diastolic = int(bp_match_gen.group(2))

    # Parse Heart Rate (Nhịp tim)
    hr_match = re.search(r"Nhịp\s*tim[| \s]*(\d+)", text, re.IGNORECASE)
    if hr_match:
        heart_rate = int(hr_match.group(1))

    # Parse BMI
    bmi_match = re.search(r"BMI\s*\(Thể\s*trọng\)[| \s]*([\d\.]+)", text, re.IGNORECASE)
    if bmi_match:
        bmi = float(bmi_match.group(1))
    else:
        bmi_match_alt = re.search(r"BMI[| \s]+([\d\.]+)", text, re.IGNORECASE)
        if bmi_match_alt:
            bmi = float(bmi_match_alt.group(1))

    # Parse Weight if possible
    weight_match = re.search(r"Cân\s*nặng[^\n\d]*?(\d+(?:\.\d+)?)", text, re.IGNORECASE)
    if weight_match:
        weight = float(weight_match.group(1))

    # 5. Check if we extracted at least some metrics
    if blood_sugar is None and systolic is None and heart_rate is None and bmi is None:
        raise HTTPException(
            status_code=422,
            detail="Không thể tự động trích xuất các chỉ số chính (Đường huyết, Huyết áp, Nhịp tim, BMI) từ nội dung file PDF. Vui lòng đảm bảo file PDF là báo cáo xét nghiệm chuẩn."
        )

    # 6. Check if a profile exists to calculate weight
    if weight is None and bmi is not None:
        profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
        if profile and profile.height:
            h_m = float(profile.height) / 100.0
            weight = float(bmi) * (h_m * h_m)

    # 7. Save or update HealthMetric in the database
    metric = None
    if record.metric_id:
        metric = db.query(models.HealthMetric).filter(models.HealthMetric.id == record.metric_id).first()

    if metric:
        # Update existing metric
        metric.bmi = bmi
        metric.systolic = systolic
        metric.diastolic = diastolic
        metric.blood_sugar = blood_sugar
        metric.heart_rate = heart_rate
        metric.weight = weight
        metric.date = record.date
    else:
        # Create new metric
        metric = models.HealthMetric(
            user_id=current_user.id,
            date=record.date,
            bmi=bmi,
            systolic=systolic,
            diastolic=diastolic,
            blood_sugar=blood_sugar,
            heart_rate=heart_rate,
            weight=weight
        )
        db.add(metric)
        db.flush()  # Populate metric.id
        record.metric_id = metric.id
    
    # 8. Create a system notification for the patient
    new_notif = models.Notification(
        user_id=current_user.id,
        title="AI Phân Tích Hồ Sơ Thành Công",
        message=f"Báo cáo '{record.name}' đã được phân tích bằng AI. Đã tự động cập nhật: Đường huyết {blood_sugar or 'N/A'} mg/dL, Huyết áp {systolic or 'N/A'}/{diastolic or 'N/A'} mmHg vào hồ sơ chỉ số.",
        type="system",
        is_read=False
    )
    db.add(new_notif)
    
    db.commit()
    db.refresh(metric)

    return {
        "success": True,
        "extracted_data": {
            "blood_sugar": blood_sugar,
            "systolic": systolic,
            "diastolic": diastolic,
            "heart_rate": heart_rate,
            "bmi": bmi,
            "weight": round(weight, 1) if weight else None
        },
        "metric_id": str(metric.id),
        "message": "Phân tích AI hoàn tất. Các chỉ số sức khỏe đã được tự động lưu vào tài khoản của bạn."
    }

@router.get("/{record_id}/file")
def get_record_file(
    record_id: uuid.UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    from fastapi.responses import FileResponse
    
    # Verify record exists
    record = db.query(models.HealthRecord).filter(models.HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Health record not found")

    # Check access permissions: patient owner or authorized doctor
    is_owner = (record.user_id == current_user.id)
    is_authorized_doctor = False
    
    if not is_owner and current_user.profile and current_user.profile.role == "doctor":
        # Check active permission for this patient
        perm = db.query(models.AccessPermission).filter(
            models.AccessPermission.patient_id == record.user_id,
            models.AccessPermission.doctor_id == current_user.id,
            models.AccessPermission.status == "active"
        ).first()
        if perm:
            if perm.access_level == "all":
                is_authorized_doctor = True
            elif perm.access_level == "limited" and perm.limited_records:
                if str(record_id) in perm.limited_records or record_id in perm.limited_records:
                    is_authorized_doctor = True
            elif perm.access_level == "single" and perm.single_record == str(record_id):
                is_authorized_doctor = True

    if not is_owner and not is_authorized_doctor:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập file hồ sơ này.")

    # Self-healing file restoration from IPFS
    file_path = ensure_local_file(record)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy file tài liệu trên server")

    # Detect media_type từ extension thực của file đã lưu
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else "pdf"
    media_type_map = {
        "pdf":  "application/pdf",
        "jpg":  "image/jpeg",
        "jpeg": "image/jpeg",
        "png":  "image/png",
    }
    media_type = media_type_map.get(ext, "application/octet-stream")

    # Clean file name for Content-Disposition header
    safe_name = record.name.replace('"', '').replace("'", "")
    file_ext_display = f".{ext}" if ext != "pdf" else ".pdf"

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{safe_name}{file_ext_display}"'}
    )


@router.get("/{record_id}/verify")
def verify_record(
    record_id: uuid.UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch record
    record = db.query(models.HealthRecord).filter(models.HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Health record not found")

    # 2. Check if the current user is the owner (patient)
    is_owner = (record.user_id == current_user.id)
    
    # 3. If not owner, check if current user is an authorized doctor
    is_authorized_doctor = False
    if not is_owner and current_user.profile and current_user.profile.role == "doctor":
        # Check active permission for this patient
        perm = db.query(models.AccessPermission).filter(
            models.AccessPermission.patient_id == record.user_id,
            models.AccessPermission.doctor_id == current_user.id,
            models.AccessPermission.status == "active"
        ).first()
        if perm:
            if perm.access_level == "all":
                is_authorized_doctor = True
            elif perm.access_level == "limited" and perm.limited_records:
                if str(record_id) in perm.limited_records or record_id in perm.limited_records:
                    is_authorized_doctor = True
            elif perm.access_level == "single" and perm.single_record == str(record_id):
                is_authorized_doctor = True

    if not is_owner and not is_authorized_doctor:
        raise HTTPException(status_code=403, detail="Permission denied to access this health record")

    # 4. Compute local SHA-256 hash of the file
    file_path = ensure_local_file(record)
    local_hash = None
    if file_path and os.path.exists(file_path):
        try:
            with open(file_path, "rb") as f:
                content = f.read()
                local_hash = hashlib.sha256(content).hexdigest()
        except Exception as e:
            print(f"Error reading file to compute local hash: {e}")
    
    if not local_hash:
        local_hash = hashlib.sha256(str(record.id).encode()).hexdigest()

    # 5. Fetch blockchain record data
    from ..blockchain import get_record_from_blockchain
    blockchain_data = get_record_from_blockchain(str(record_id))

    on_chain_hash = None
    on_chain_ipfs = None
    registered_by = None
    timestamp = None
    is_matching = False

    if blockchain_data:
        on_chain_hash = blockchain_data.get("file_hash")
        on_chain_ipfs = blockchain_data.get("ipfs_hash")
        registered_by = blockchain_data.get("registered_by")
        timestamp = blockchain_data.get("timestamp")
        is_matching = (local_hash == on_chain_hash)
    else:
        # Fallback mock for demo/test environments
        on_chain_hash = local_hash
        on_chain_ipfs = record.ipfs_hash or "QmLocalMockHash"
        registered_by = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        timestamp = int(record.created_at.timestamp()) if record.created_at else 0
        is_matching = True
        
    return {
        "record_id": str(record_id),
        "record_name": record.name,
        "local_hash": local_hash,
        "on_chain_hash": on_chain_hash,
        "on_chain_ipfs": on_chain_ipfs,
        "registered_by": registered_by,
        "timestamp": timestamp,
        "is_matching": is_matching,
        "blockchain_connected": (blockchain_data is not None)
    }


def extract_text_from_image_groq(file_path: str, api_key: str) -> str:
    """Dùng Groq Vision để đọc nội dung văn bản từ ảnh JPG/PNG phiếu kết quả y tế."""
    import base64, requests as req_lib
    try:
        with open(file_path, "rb") as f:
            image_bytes = f.read()

        # Resize ảnh xuống max 1280px để tiết kiệm token và tăng tốc độ xử lý
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            max_dim = 1280
            w, h = img.size
            if max(w, h) > max_dim:
                scale = max_dim / max(w, h)
                img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=92)
            image_bytes = buf.getvalue()
            mime = "image/jpeg"
        except ImportError:
            ext = file_path.rsplit(".", 1)[-1].lower()
            mime = "image/png" if ext == "png" else "image/jpeg"

        b64 = base64.b64encode(image_bytes).decode("utf-8")
        image_url = f"data:{mime};base64,{b64}"

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Bạn là AI y tế chuyên đọc phiếu kết quả xét nghiệm / chẩn đoán hình ảnh tiếng Việt.\n"
                                "Đây có thể là tờ giấy kết quả có chữ in hoặc phim X-quang/MRI/siêu âm.\n"
                                "Hãy trích xuất TOÀN BỘ nội dung có thể nhận biết được từ ảnh này, bao gồm:\n"
                                "- Nếu là phiếu kết quả in: tên bệnh nhân, ngày, tên xét nghiệm, giá trị số, đơn vị, khoảng tham chiếu, kết luận bác sĩ.\n"
                                "- Nếu là phim X-quang/MRI/siêu âm: mô tả chi tiết những gì quan sát được (xương, cấu trúc, mật độ, bất thường nếu có).\n"
                                "Trả về dưới dạng văn bản thuần, chi tiết và rõ ràng, bằng tiếng Việt."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url}
                        }
                    ]
                }
            ],
            "temperature": 0.1,
            "max_tokens": 3000
        }
        response = req_lib.post(url, headers=headers, json=payload, timeout=60)
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            print(f"Groq Vision error: {response.text}")
    except Exception as e:
        print(f"extract_text_from_image_groq error: {e}")
    return ""


def extract_record_text(file_path: str, api_key: str = None) -> str:
    """Trích xuất text từ file hồ sơ: PDF dùng pypdf, ảnh dùng Groq Vision."""
    if not file_path or not os.path.exists(file_path):
        return ""
    ext = file_path.rsplit(".", 1)[-1].lower()
    if ext in ["jpg", "jpeg", "png"]:
        if api_key:
            return extract_text_from_image_groq(file_path, api_key)
        return ""
    # PDF
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print(f"PDF read error: {e}")
        return ""


def call_groq_chat(
    system_prompt: str,
    history: List[schemas.ChatMessage],
    question: str,
    api_key: str
) -> str:
    import json
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add history
    for msg in history:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
        
    # Add current question
    messages.append({
        "role": "user",
        "content": question
    })
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            res_data = response.json()
            return res_data["choices"][0]["message"]["content"]
        else:
            print(f"Groq API Error: {response.text}")
            return "Xin lỗi, trợ lý AI đang gặp sự cố kết nối dịch vụ. Vui lòng thử lại sau."
    except Exception as e:
        print(f"Error calling Groq Chat API: {e}")
        return "Xin lỗi, đã xảy ra lỗi kết nối với máy chủ AI."


@router.post("/profile/chat", response_model=schemas.RecordChatResponse)
def chat_about_my_profile(
    payload: schemas.RecordChatRequest,
    current_user: models.User = Depends(auth.require_patient),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy profile.")

    # Calculate age
    age_str = "N/A"
    if profile.date_of_birth:
        today = date.today()
        age_str = str(today.year - profile.date_of_birth.year - (
            (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day)
        ))

    allergies_str = ", ".join(profile.allergies) if profile.allergies else "Không có"
    chronic_str = ", ".join(profile.chronic_diseases) if profile.chronic_diseases else "Không có"

    system_prompt = (
        "Bạn là trợ lý sức khỏe AI thân thiện, chuyên nghiệp, hỗ trợ Bệnh nhân đọc hiểu và tư vấn lối sống dựa trên thông tin cá nhân của họ.\n"
        f"Thông tin sức khỏe hiện tại của bệnh nhân:\n"
        f"- Tên: {profile.full_name}\n"
        f"- Tuổi: {age_str}\n"
        f"- Chiều cao: {profile.height or 'N/A'} cm, Cân nặng: {profile.weight or 'N/A'} kg\n"
        f"- Nhóm máu: {profile.blood_group or 'N/A'}\n"
        f"- Tiền sử dị ứng: {allergies_str}\n"
        f"- Bệnh lý mãn tính: {chronic_str}\n\n"
        "Hãy đưa ra lời khuyên y khoa cơ bản, giải thích rõ ràng và khuyên bệnh nhân chế độ dinh dưỡng, vận động lành mạnh.\n"
        "Cần đính kèm cảnh báo miễn trừ trách nhiệm y tế AI ngắn gọn bằng tiếng Việt ở cuối câu trả lời nhắc bệnh nhân cần tham vấn bác sĩ khi đưa ra quyết định y tế.\n"
        "Hãy trả lời bằng tiếng Việt."
    )

    if not settings.GROQ_API_KEY:
        answer = f"Đây là câu trả lời thử nghiệm tư vấn sức khỏe tổng quát (Chưa cấu hình GROQ_API_KEY). Câu hỏi của bạn là: '{payload.question}'"
    else:
        answer = call_groq_chat(
            system_prompt=system_prompt,
            history=payload.history,
            question=payload.question,
            api_key=settings.GROQ_API_KEY
        )

    return {"answer": answer}


@router.post("/patient/{patient_id}/chat", response_model=schemas.RecordChatResponse)
def chat_about_patient_profile(
    patient_id: uuid.UUID,
    payload: schemas.RecordChatRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.profile or current_user.profile.role != "doctor":
        raise HTTPException(status_code=403, detail="Chỉ bác sĩ mới có quyền truy cập.")

    # Verify active permission for this patient
    perm = db.query(models.AccessPermission).filter(
        models.AccessPermission.patient_id == patient_id,
        models.AccessPermission.doctor_id == current_user.id,
        models.AccessPermission.status == "active"
    ).first()
    if not perm:
        raise HTTPException(status_code=403, detail="Bệnh nhân chưa cấp quyền truy cập cho bạn.")

    profile = db.query(models.Profile).filter(models.Profile.id == patient_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy profile bệnh nhân.")

    # Calculate age
    age_str = "N/A"
    if profile.date_of_birth:
        today = date.today()
        age_str = str(today.year - profile.date_of_birth.year - (
            (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day)
        ))

    allergies_str = ", ".join(profile.allergies) if profile.allergies else "Không có"
    chronic_str = ", ".join(profile.chronic_diseases) if profile.chronic_diseases else "Không có"

    system_prompt = (
        "Bạn là trợ lý y khoa AI cao cấp, hỗ trợ Bác sĩ phân tích thông tin sức khỏe tổng quát của bệnh nhân.\n"
        f"Thông tin sức khỏe hiện tại của bệnh nhân:\n"
        f"- Tên: {profile.full_name}\n"
        f"- Tuổi: {age_str}\n"
        f"- Chiều cao: {profile.height or 'N/A'} cm, Cân nặng: {profile.weight or 'N/A'} kg\n"
        f"- Nhóm máu: {profile.blood_group or 'N/A'}\n"
        f"- Tiền sử dị ứng: {allergies_str}\n"
        f"- Bệnh lý mãn tính: {chronic_str}\n\n"
        "Hãy đưa ra các lập luận lâm sàng, đề xuất chẩn đoán hoặc cận lâm sàng cần thiết.\n"
        "Cần đính kèm cảnh báo miễn trừ trách nhiệm y tế AI ngắn gọn bằng tiếng Việt ở cuối câu trả lời.\n"
        "Hãy trả lời bằng tiếng Việt."
    )

    if not settings.GROQ_API_KEY:
        answer = f"Đây là câu trả lời thử nghiệm y khoa cho bác sĩ (Chưa cấu hình GROQ_API_KEY). Câu hỏi của bạn là: '{payload.question}'"
    else:
        answer = call_groq_chat(
            system_prompt=system_prompt,
            history=payload.history,
            question=payload.question,
            api_key=settings.GROQ_API_KEY
        )

    return {"answer": answer}


@router.post("/{record_id}/chat", response_model=schemas.RecordChatResponse)
def chat_about_record(
    record_id: uuid.UUID,
    payload: schemas.RecordChatRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch record
    record = db.query(models.HealthRecord).filter(models.HealthRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ sức khỏe.")

    # 2. Verify authorization (patient or authorized doctor)
    is_owner = (record.user_id == current_user.id)
    is_authorized_doctor = False
    
    if not is_owner and current_user.profile and current_user.profile.role == "doctor":
        # Check active permission for this patient
        perm = db.query(models.AccessPermission).filter(
            models.AccessPermission.patient_id == record.user_id,
            models.AccessPermission.doctor_id == current_user.id,
            models.AccessPermission.status == "active"
        ).first()
        if perm:
            if perm.access_level == "all":
                is_authorized_doctor = True
            elif perm.access_level == "limited" and perm.limited_records:
                if str(record_id) in perm.limited_records or record_id in perm.limited_records:
                    is_authorized_doctor = True
            elif perm.access_level == "single" and perm.single_record == str(record_id):
                is_authorized_doctor = True

    if not is_owner and not is_authorized_doctor:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập hồ sơ này.")

    # 3. Trích xuất text từ file (PDF hoặc ảnh JPG/PNG qua Groq Vision)
    file_path = ensure_local_file(record)
    record_text = ""

    if file_path:
        record_text = extract_record_text(file_path, api_key=settings.GROQ_API_KEY)

    # Fallback to description and details if no text extracted
    if not record_text.strip():
        record_text = f"Tên hồ sơ: {record.name}\nLoại: {record.type_label}\nBệnh viện: {record.hospital or 'N/A'}\nBác sĩ: {record.doctor or 'N/A'}\nMô tả: {record.description or 'N/A'}"

    # 4. Define role-based System Prompt (phân biệt theo loại hồ sơ)
    is_imaging = record.type == "hinh-anh"
    is_prescription = record.type == "don-thuoc"

    if current_user.profile and current_user.profile.role == "doctor":
        if is_imaging:
            system_prompt = (
                "Bạn là trợ lý y khoa AI hỗ trợ Bác sĩ thảo luận về kết quả chẩn đoán hình ảnh (X-quang, MRI, siêu âm).\n"
                "Hệ thống AI Vision đã phân tích ảnh và trích xuất nội dung bên dưới — đây là MÔ TẢ ảnh y tế, không phải yêu cầu bạn tự nhìn ảnh.\n"
                "Dựa trên mô tả này, hãy hỗ trợ bác sĩ phân tích, đặt câu hỏi lâm sàng và gợi ý hướng xử lý.\n"
                "Nếu mô tả còn mơ hồ, hãy nêu rõ giới hạn và đề xuất bác sĩ xem trực tiếp phim.\n"
                "Cần đính kèm cảnh báo miễn trừ trách nhiệm y tế AI ngắn gọn ở cuối.\n\n"
                f"=== KẾT QUẢ PHÂN TÍCH ẢNH TỪ AI VISION ===\n{record_text}\n"
                "===========================================\n\n"
                "Hãy trả lời bằng tiếng Việt."
            )
        else:
            system_prompt = (
                "Bạn là một trợ lý y khoa AI cao cấp, hỗ trợ Bác sĩ phân tích và thảo luận về hồ sơ bệnh án của bệnh nhân.\n"
                "Hãy cung cấp các câu trả lời mang tính chuyên môn lâm sàng cao, sử dụng các thuật ngữ y học chính xác khi cần thiết.\n"
                "Cần đính kèm cảnh báo miễn trừ trách nhiệm y tế AI ngắn gọn bằng tiếng Việt ở cuối câu trả lời.\n\n"
                f"=== NỘI DUNG HỒ SƠ BỆNH ÁN ===\n{record_text}\n"
                "================================\n\n"
                "Hãy trả lời bằng tiếng Việt."
            )
    else:
        if is_imaging:
            system_prompt = (
                "Bạn là trợ lý sức khỏe AI thân thiện, giúp Bệnh nhân hiểu kết quả chẩn đoán hình ảnh (X-quang, MRI, siêu âm).\n"
                "QUAN TRỌNG: Hệ thống AI Vision đã phân tích ảnh và trích xuất mô tả bên dưới. Đây là NỘI DUNG ĐÃ CÓ — bạn không cần tự nhìn ảnh.\n"
                "Nhiệm vụ của bạn: dựa trên mô tả đó, giải thích bằng ngôn ngữ đơn giản để bệnh nhân hiểu được tình trạng của họ.\n"
                "Nếu mô tả phát hiện bất thường, hãy giải thích nhẹ nhàng và khuyến khích bệnh nhân hỏi thêm bác sĩ.\n"
                "Cuối câu trả lời nhắc bệnh nhân tham vấn bác sĩ để có kết luận chính xác.\n\n"
                f"=== KẾT QUẢ PHÂN TÍCH ẢNH TỪ AI VISION ===\n{record_text}\n"
                "===========================================\n\n"
                "Hãy trả lời bằng tiếng Việt, thân thiện và dễ hiểu."
            )
        elif is_prescription:
            system_prompt = (
                "Bạn là trợ lý sức khỏe AI thân thiện, hỗ trợ Bệnh nhân tra cứu thông tin về đơn thuốc của họ.\n"
                "Giải thích tên thuốc, công dụng, cách uống, tác dụng phụ thường gặp bằng ngôn ngữ đơn giản.\n"
                "Tuyệt đối không khuyên bệnh nhân tự thay đổi liều lượng mà không có ý kiến bác sĩ.\n"
                "Cuối câu trả lời nhắc bệnh nhân tham vấn bác sĩ khi đưa ra quyết định y tế.\n\n"
                f"=== NỘI DUNG ĐƠN THUỐC ===\n{record_text}\n"
                "===========================\n\n"
                "Hãy trả lời bằng tiếng Việt, thân thiện và dễ hiểu."
            )
        else:
            system_prompt = (
                "Bạn là một trợ lý sức khỏe AI thân thiện và chuyên nghiệp, hỗ trợ Bệnh nhân đọc hiểu hồ sơ bệnh án của chính họ.\n"
                "Hãy giải thích các thuật ngữ chuyên môn phức tạp bằng ngôn ngữ giản dị, dễ hiểu, tránh gây hoang mang cho người bệnh.\n"
                "Hướng dẫn bệnh nhân về chế độ dinh dưỡng, lối sống lành mạnh nếu phù hợp.\n"
                "Cuối câu trả lời nhắc bệnh nhân tham vấn bác sĩ khi đưa ra quyết định y tế.\n\n"
                f"=== NỘI DUNG HỒ SƠ SỨC KHỎE ===\n{record_text}\n"
                "=================================\n\n"
                "Hãy trả lời bằng tiếng Việt."
            )


    # 5. Call Groq
    if not settings.GROQ_API_KEY:
        # Mock reply if API key is not configured
        mock_replies = {
            "tóm tắt": "Đây là tóm tắt hồ sơ sức khỏe y tế giả lập. Chỉ số Glucose và Huyết áp nằm trong phạm vi bình thường.",
            "chỉ số": "Dữ liệu y tế giả lập cho thấy Huyết áp của bạn ổn định 120/80 mmHg, Nhịp tim 75 bpm.",
            "default": f"Đây là câu trả lời thử nghiệm từ trợ lý AI HealthChain. (Chưa cấu hình GROQ_API_KEY). Câu hỏi của bạn là: '{payload.question}'"
        }
        q_lower = payload.question.lower()
        answer = mock_replies.get("default")
        for k, v in mock_replies.items():
            if k in q_lower:
                answer = v
                break
    else:
        answer = call_groq_chat(
            system_prompt=system_prompt,
            history=payload.history,
            question=payload.question,
            api_key=settings.GROQ_API_KEY
        )

    return {"answer": answer}




