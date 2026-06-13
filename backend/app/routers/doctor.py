import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter()


def require_verified_doctor(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
) -> models.Profile:
    """Dependency: yêu cầu user phải là bác sĩ đã được xác minh."""
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ.")
    if profile.role != "doctor":
        raise HTTPException(status_code=403, detail="Chỉ bác sĩ mới có quyền truy cập.")
    if not profile.is_verified:
        raise HTTPException(status_code=403, detail="Tài khoản bác sĩ chưa được xác minh.")
    return profile


@router.get("/patients", response_model=List[schemas.AccessPermissionResponse])
def get_my_patients(
    doctor: models.Profile = Depends(require_verified_doctor),
    db: Session = Depends(get_db)
):
    """Lấy danh sách bệnh nhân đã cấp quyền cho bác sĩ này."""
    permissions = db.query(models.AccessPermission).filter(
        models.AccessPermission.doctor_id == doctor.id,
        models.AccessPermission.status == "active"
    ).order_by(models.AccessPermission.created_at.desc()).all()
    return permissions


@router.get("/patients/{patient_id}/records", response_model=List[schemas.HealthRecordResponse])
def get_patient_records(
    patient_id: uuid.UUID,
    request: Request,
    doctor: models.Profile = Depends(require_verified_doctor),
    db: Session = Depends(get_db)
):
    """Lấy danh sách hồ sơ của bệnh nhân (nếu có quyền truy cập hợp lệ)."""
    # Kiểm tra permission còn hiệu lực
    permission = db.query(models.AccessPermission).filter(
        models.AccessPermission.doctor_id == doctor.id,
        models.AccessPermission.patient_id == patient_id,
        models.AccessPermission.status == "active"
    ).first()

    if not permission:
        raise HTTPException(
            status_code=403,
            detail="Bệnh nhân chưa cấp quyền truy cập cho bạn hoặc quyền đã hết hạn."
        )

    # Kiểm tra ngày hết hạn
    from datetime import date
    if permission.expiry_date < date.today():
        permission.status = "expired"
        db.commit()
        raise HTTPException(status_code=403, detail="Quyền truy cập đã hết hạn.")

    # Lấy records tùy access_level
    if permission.access_level == "all":
        records = db.query(models.HealthRecord).filter(
            models.HealthRecord.user_id == patient_id
        ).order_by(models.HealthRecord.created_at.desc()).all()

    elif permission.access_level == "limited" and permission.limited_records:
        records = db.query(models.HealthRecord).filter(
            models.HealthRecord.id.in_(permission.limited_records)
        ).all()

    elif permission.access_level == "single" and permission.single_record:
        record = db.query(models.HealthRecord).filter(
            models.HealthRecord.id == permission.single_record
        ).first()
        records = [record] if record else []

    else:
        records = []

    # Ghi access log (luôn ghi để audit đầy đủ)
    device_info = request.headers.get("user-agent", "")[:200]
    ip_address = request.client.host if request.client else None

    log = models.AccessLog(
        permission_id=permission.id,
        doctor_id=doctor.id,
        patient_id=patient_id,
        action="viewed_records",
        ip_address=ip_address,
        device_info=device_info,
    )
    db.add(log)

    # Tăng total_accesses theo "phiên" — chỉ tính nếu cách lần trước > 30 phút
    # Tránh tình huống bác sĩ vào xem rồi quay lại ngay bị tính thêm 1 lần
    COOLDOWN_MINUTES = 30
    now = datetime.utcnow()
    last = permission.last_access
    is_new_session = (
        last is None or
        (now - last).total_seconds() > COOLDOWN_MINUTES * 60
    )

    if is_new_session:
        permission.total_accesses += 1

    permission.last_access = now
    db.commit()

    return records


@router.get("/patients/{patient_id}/profile", response_model=schemas.ProfileResponse)
def get_patient_profile(
    patient_id: uuid.UUID,
    doctor: models.Profile = Depends(require_verified_doctor),
    db: Session = Depends(get_db)
):
    """Lấy thông tin hồ sơ của bệnh nhân (nếu có quyền)."""
    permission = db.query(models.AccessPermission).filter(
        models.AccessPermission.doctor_id == doctor.id,
        models.AccessPermission.patient_id == patient_id,
        models.AccessPermission.status == "active"
    ).first()

    if not permission:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập hồ sơ bệnh nhân này.")

    patient = db.query(models.Profile).filter(models.Profile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân.")

    return patient


@router.get("/patients/{patient_id}/records/{record_id}/file")
def get_patient_record_file(
    patient_id: uuid.UUID,
    record_id: uuid.UUID,
    download: bool = False,
    doctor: models.Profile = Depends(require_verified_doctor),
    db: Session = Depends(get_db)
):
    """Bác sĩ xem file của một record bệnh nhân (nếu có quyền)."""
    import os
    from fastapi.responses import FileResponse

    # Kiểm tra permission
    permission = db.query(models.AccessPermission).filter(
        models.AccessPermission.doctor_id == doctor.id,
        models.AccessPermission.patient_id == patient_id,
        models.AccessPermission.status == "active"
    ).first()

    if not permission:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập hồ sơ bệnh nhân này.")

    # Kiểm tra record thuộc bệnh nhân và có trong phạm vi quyền
    record = db.query(models.HealthRecord).filter(
        models.HealthRecord.id == record_id,
        models.HealthRecord.user_id == patient_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ.")

    # Kiểm tra access_level
    if permission.access_level == "single":
        if str(permission.single_record) != str(record_id):
            raise HTTPException(status_code=403, detail="Quyền truy cập chỉ giới hạn cho một hồ sơ khác.")
    elif permission.access_level == "limited":
        allowed = [str(r) for r in (permission.limited_records or [])]
        if str(record_id) not in allowed:
            raise HTTPException(status_code=403, detail="Hồ sơ này không nằm trong phạm vi quyền truy cập.")

    # Tìm file trong uploads (tự động khôi phục từ IPFS nếu mất bản sao cục bộ)
    from .records import ensure_local_file
    file_path = ensure_local_file(record)

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File hồ sơ không tồn tại trên server. Tài liệu có thể chỉ lưu trên IPFS."
        )

    # Set media type
    media_type = "application/pdf"
    if record.type == "hinh-anh":
        media_type = "image/jpeg"

    from fastapi.responses import FileResponse
    safe_name = record.name.replace('"', '')
    disposition = f'attachment; filename="{safe_name}.pdf"' if download else f'inline; filename="{safe_name}.pdf"'

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={"Content-Disposition": disposition}
    )

import os
from fastapi import UploadFile, File

def require_doctor(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
) -> models.Profile:
    """Dependency: yêu cầu user phải là bác sĩ (bất kể trạng thái xác minh)."""
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ.")
    if profile.role != "doctor":
        raise HTTPException(status_code=403, detail="Chỉ bác sĩ mới có quyền truy cập.")
    return profile

import base64
import requests
import json
import unicodedata
import re

def clean_vietnamese_name(name: str) -> str:
    """Chuyển tên tiếng Việt về dạng không dấu, viết thường, bỏ khoảng trắng thừa để so sánh."""
    if not name:
        return ""
    n = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('utf-8')
    n = n.lower().strip()
    n = re.sub(r'\s+', ' ', n)
    return n

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Đọc văn bản từ tệp tin PDF bytes."""
    import io
    from pypdf import PdfReader
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def call_groq_vision(image_bytes: bytes, mime_type: str, api_key: str) -> dict:
    """Gọi Groq Vision API để phân tích hình ảnh chứng chỉ."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    image_url = f"data:{mime_type};base64,{base64_image}"
    
    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "You are an AI medical license verifier. Analyze the attached medical practice certificate "
                            "(Chứng chỉ hành nghề khám bệnh, chữa bệnh) image and extract: "
                            "1. 'full_name' (Doctor's name, in UPPERCASE) "
                            "2. 'license_number' (CCHN license number, e.g. '12345/BYT-CCHN' or '001234/HNO-CCHN') "
                            "3. 'specialty' (Scope of practice / specialty) "
                            "4. 'is_valid' (boolean: true if it looks like a real Vietnamese medical certificate, false otherwise). "
                            "Output only a JSON object matching these keys."
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    }
                ]
            }
        ],
        "temperature": 0.1
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code == 200:
        res_data = response.json()
        content = res_data["choices"][0]["message"]["content"]
        return json.loads(content)
    else:
        print(f"Groq API Error: {response.text}")
        return None

def extract_text_from_image_bytes(image_bytes: bytes, ext: str) -> str:
    """Gọi OCR.space API để trích xuất văn bản tiếng Việt/không dấu từ hình ảnh."""
    url = "https://api.ocr.space/parse/image"
    payload = {
        "apikey": "helloworld",  # Sử dụng free API key của OCR.space
        "language": "eng",       # Tiếng Anh/Latin (phù hợp với CCHN Việt Nam không dấu và dễ nhận diện số/kí tự)
        "isOverlayRequired": False,
    }
    
    mime_type = "image/png"
    if ext in ["jpg", "jpeg"]:
        mime_type = "image/jpeg"
        
    files = {
        "file": (f"certificate.{ext}", image_bytes, mime_type)
    }
    
    try:
        response = requests.post(url, data=payload, files=files, timeout=20)
        if response.status_code == 200:
            res_json = response.json()
            if "ParsedResults" in res_json and len(res_json["ParsedResults"]) > 0:
                return res_json["ParsedResults"][0]["ParsedText"]
            else:
                print(f"OCR.space response error: {res_json}")
        else:
            print(f"OCR.space HTTP error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error calling OCR.space API: {e}")
    return ""

def call_groq_text(text_content: str, api_key: str) -> dict:
    """Gọi Groq Chat API để phân tích văn bản trích xuất từ PDF hoặc OCR hình ảnh."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an AI medical license verifier. Analyze the text of a medical practice certificate "
                    "(which may contain OCR character typos like '8' instead of 'B', '0' instead of 'O', etc.) "
                    "and return a JSON object with these keys:\n"
                    "1. 'full_name' (Doctor's name, in UPPERCASE)\n"
                    "2. 'license_number' (CCHN license number, e.g. '12345/BYT-CCHN'). Attempt to correct typical OCR typos.\n"
                    "3. 'specialty' (Scope of practice / specialty)\n"
                    "4. 'is_valid' (boolean: true if the text matches a valid medical practice certificate, false otherwise)."
                )
            },
            {
                "role": "user",
                "content": text_content
            }
        ],
        "temperature": 0.1
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code == 200:
        res_data = response.json()
        content = res_data["choices"][0]["message"]["content"]
        return json.loads(content)
    else:
        print(f"Groq API Error: {response.text}")
        return None

@router.post("/upload-certificate")
async def upload_certificate(
    file: UploadFile = File(...),
    doctor: models.Profile = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """Bác sĩ chưa xác minh tải lên ảnh chụp hoặc PDF Chứng chỉ hành nghề."""
    # Check file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Định dạng file không hỗ trợ. Vui lòng tải lên file ảnh (JPG, PNG) hoặc PDF."
        )

    # Read content for AI OCR analysis
    try:
        content = await file.read()
        # Seek back to 0 so we can read it again for Cloudinary / Local upload
        await file.seek(0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi đọc file: {str(e)}")

    # Check Cloudinary settings
    from ..config import settings
    import cloudinary
    import cloudinary.uploader

    has_cloudinary = (
        settings.CLOUDINARY_CLOUD_NAME and 
        settings.CLOUDINARY_CLOUD_NAME != "your_cloud_name" and
        settings.CLOUDINARY_API_KEY and
        settings.CLOUDINARY_API_KEY != "your_api_key" and
        settings.CLOUDINARY_API_SECRET and
        settings.CLOUDINARY_API_SECRET != "your_api_secret"
    )

    if has_cloudinary:
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
            # Upload file directly to Cloudinary (resource_type="auto" handles PDFs and images)
            upload_result = cloudinary.uploader.upload(
                file.file,
                folder="healthchain_certificates",
                public_id=f"doc_{doctor.id}",
                overwrite=True,
                resource_type="auto"
            )
            certificate_url = upload_result.get("secure_url")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi tải lên Cloudinary: {str(e)}")
    else:
        # Prepare directories
        UPLOAD_DIR = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
        )
        CERT_DIR = os.path.join(UPLOAD_DIR, "certificates")
        os.makedirs(CERT_DIR, exist_ok=True)

        # Save file locally
        file_name = f"{doctor.id}.{ext}"
        file_path = os.path.join(CERT_DIR, file_name)
        try:
            with open(file_path, "wb") as f:
                f.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi lưu file cục bộ: {str(e)}")

        certificate_url = f"/api/doctor/certificate?ext={ext}"

    # Update profile
    doctor.certificate_url = certificate_url
    doctor.certificate_name = file.filename
    doctor.verification_status = "pending"
    doctor.verification_feedback = "Đang xác thực bằng AI..."
    db.commit()

    # AI Verification using Groq
    ai_status = "pending"
    ai_message = "Minh chứng CCHN đã được tải lên thành công. Đang chờ Admin phê duyệt thủ công."

    if settings.GROQ_API_KEY:
        try:
            ai_result = None
            if ext == "pdf":
                pdf_text = extract_text_from_pdf_bytes(content)
                if pdf_text.strip():
                    ai_result = call_groq_text(pdf_text, settings.GROQ_API_KEY)
            else: # Image
                ocr_text = extract_text_from_image_bytes(content, ext)
                if ocr_text.strip():
                    ai_result = call_groq_text(ocr_text, settings.GROQ_API_KEY)

            if ai_result:
                name_reg = clean_vietnamese_name(doctor.full_name)
                name_ai = clean_vietnamese_name(ai_result.get("full_name", ""))
                name_matches = (name_reg in name_ai) or (name_ai in name_reg) if (name_reg and name_ai) else False

                lic_reg = "".join(c for c in (doctor.license_number or "") if c.isalnum())
                lic_ai = "".join(c for c in (ai_result.get("license_number", "") or "") if c.isalnum())
                lic_matches = (lic_reg in lic_ai) or (lic_ai in lic_reg) if (lic_reg and lic_ai) else False

                is_valid = ai_result.get("is_valid", False)

                if is_valid and name_matches and lic_matches:
                    # Auto Approve!
                    doctor.is_verified = True
                    doctor.verification_status = "approved"
                    doctor.verification_feedback = "Xác minh tự động thành công. Tên và Số CCHN khớp với thông tin đã đăng ký."
                    db.commit()
                    
                    # Create notification
                    notif = models.Notification(
                        user_id=doctor.id,
                        type="system",
                        title="🎉 Tài khoản bác sĩ được kích hoạt tự động",
                        message=(
                            "Hệ thống AI đã xác minh thành công chứng chỉ hành nghề của bạn. "
                            "Tài khoản của bạn hiện đã được kích hoạt đầy đủ."
                        ),
                        icon="check-circle",
                        color="success"
                    )
                    db.add(notif)
                    db.commit()

                    ai_status = "approved"
                    ai_message = "Xác minh AI thành công! Tài khoản bác sĩ của bạn đã được kích hoạt tự động."
                else:
                    doctor.is_verified = False
                    doctor.verification_status = "failed"
                    doctor.verification_feedback = "Chứng chỉ hành nghề không hợp lệ hoặc thông tin không khớp."
                    db.commit()

                    ai_status = "failed"
                    ai_message = "Chứng chỉ hành nghề không hợp lệ hoặc thông tin không khớp."
            else:
                doctor.is_verified = False
                doctor.verification_status = "failed"
                doctor.verification_feedback = "Chứng chỉ hành nghề không hợp lệ hoặc thông tin không khớp."
                db.commit()
                ai_status = "failed"
                ai_message = "Chứng chỉ hành nghề không hợp lệ hoặc thông tin không khớp."
        except Exception as e:
            print(f"Error during AI certificate verification: {e}")
            doctor.is_verified = False
            doctor.verification_status = "failed"
            doctor.verification_feedback = "Chứng chỉ hành nghề không hợp lệ hoặc thông tin không khớp."
            db.commit()
            
            ai_status = "failed"
            ai_message = "Chứng chỉ hành nghề không hợp lệ hoặc thông tin không khớp."
    else:
        doctor.is_verified = False
        doctor.verification_status = "pending"
        doctor.verification_feedback = "Tính năng xác minh AI đang tạm dừng. Hồ sơ đang chờ quản trị viên phê duyệt thủ công."
        db.commit()

    db.refresh(doctor)
    return {
        "success": True,
        "certificate_url": doctor.certificate_url,
        "is_verified": doctor.is_verified,
        "ai_status": ai_status,
        "message": ai_message
    }

@router.get("/certificate")
def get_certificate(
    ext: str = "pdf",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """API trả về file certificate để xem trực tiếp."""
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ.")
    
    # Bác sĩ chỉ xem được certificate của chính mình
    doctor_id = current_user.id

    from fastapi.responses import FileResponse, RedirectResponse
    if profile.certificate_url and profile.certificate_url.startswith("http"):
        return RedirectResponse(profile.certificate_url)

    UPLOAD_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
    )
    file_path = os.path.join(UPLOAD_DIR, "certificates", f"{doctor_id}.{ext}")
    
    if not os.path.exists(file_path):
        found = False
        for e in ["jpg", "jpeg", "png", "pdf"]:
            alt_path = os.path.join(UPLOAD_DIR, "certificates", f"{doctor_id}.{e}")
            if os.path.exists(alt_path):
                file_path = alt_path
                ext = e
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu chứng chỉ hành nghề.")

    media_type = "application/pdf"
    if ext in ["jpg", "jpeg", "png"]:
        media_type = f"image/{'jpeg' if ext in ['jpg', 'jpeg'] else 'png'}"

    return FileResponse(file_path, media_type=media_type)

