import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth
from ..limiter import limiter
from .sessions import create_session, parse_device_label

router = APIRouter()

@router.post("/signup", response_model=schemas.Token)
@limiter.limit("5/minute")
def signup(request: Request, user_data: schemas.UserRegister, response: Response, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng."
        )

    # Hash password
    hashed_pwd = auth.get_password_hash(user_data.password)

    # Create User
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Profile — bác sĩ tự động is_verified=True (MVP, sau thêm upload chứng chỉ)
    new_profile = models.Profile(
        id=new_user.id,
        full_name=user_data.fullName,
        email=user_data.email,
        phone=user_data.phone,
        date_of_birth=user_data.dateOfBirth,
        gender=user_data.gender,
        role=user_data.role,
        specialty=getattr(user_data, 'specialty', None),
        hospital=getattr(user_data, 'hospital', None),
        license_number=getattr(user_data, 'license_number', None),
        is_verified=False,  # Mọi bác sĩ mới đều cần admin xác minh, KHÔNG auto-verify
        language="vi",
        two_factor_enabled=False,
        passkey_enabled=False,
        notifications_enabled=True
    )
    db.add(new_profile)
    db.commit()

    # Generate token
    token_data = {"sub": str(new_user.id), "role": user_data.role}
    access_token = auth.create_access_token(data=token_data)

    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=1440 * 60,
        samesite="lax",
        secure=False
    )

    # Ghi session
    try:
        create_session(db, new_user, request)
    except Exception:
        pass  # Không làm gán dừng signup nếu session tạo lỗi

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, login_data: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác."
        )

    profile = db.query(models.Profile).filter(models.Profile.id == user.id).first()
    role = profile.role if profile else "patient"

    # Generate token
    token_data = {"sub": str(user.id), "role": role}
    access_token = auth.create_access_token(data=token_data)

    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=1440 * 60,
        samesite="lax",
        secure=False
    )

    # Ghi session vào DB
    try:
        create_session(db, user, request)
    except Exception:
        pass
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
        },
        "profile": schemas.ProfileResponse.from_orm(profile).dict() if profile else None
    }

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Logout: xóa cookie và vô hiệu hoá session hiện tại."""
    response.delete_cookie(key="access_token")
    # Cố gắng xác định user từ token và vô hiệu hoá session
    try:
        token = request.cookies.get("access_token")
        if token:
            import jwt
            from ..config import settings
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub")
            ip = request.client.host if request.client else None
            ua = request.headers.get("user-agent", "")[:512]
            if user_id:
                session = db.query(models.UserSession).filter(
                    models.UserSession.user_id == user_id,
                    models.UserSession.ip_address == ip,
                    models.UserSession.is_active == True,
                ).order_by(models.UserSession.last_active.desc()).first()
                if session:
                    session.is_active = False
                    db.commit()
    except Exception:
        pass
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=schemas.ProfileResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.put("/profile", response_model=schemas.ProfileResponse)
def update_profile(
    profile_update: schemas.ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Update fields
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile

@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    import time
    import cloudinary
    import cloudinary.uploader
    from ..config import settings
    
    # Check file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(
            status_code=400,
            detail="Định dạng file không hỗ trợ. Vui lòng tải lên file ảnh (JPG, PNG, WEBP)."
        )

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
            # Upload file stream directly to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file.file,
                folder="healthchain_avatars",
                public_id=f"user_{current_user.id}",
                overwrite=True,
                resource_type="image"
            )
            avatar_url = upload_result.get("secure_url")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi tải lên Cloudinary: {str(e)}")
    else:
        # Local storage fallback
        import os
        UPLOAD_DIR = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
        )
        AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
        os.makedirs(AVATAR_DIR, exist_ok=True)

        file_name = f"{current_user.id}.{ext}"
        file_path = os.path.join(AVATAR_DIR, file_name)
        try:
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi khi lưu file cục bộ: {str(e)}")
        
        timestamp = int(time.time())
        avatar_url = f"/api/auth/profile/avatar/{current_user.id}?ext={ext}&t={timestamp}"

    # Update profile
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ người dùng.")

    profile.avatar_url = avatar_url
    db.commit()
    db.refresh(profile)
    return {"message": "Tải lên ảnh đại diện thành công!", "avatar_url": profile.avatar_url}

@router.get("/profile/avatar/{user_id}")
def get_avatar(
    user_id: str,
    ext: Optional[str] = "png",
    db: Session = Depends(get_db)
):
    import os
    from fastapi.responses import FileResponse, RedirectResponse
    
    # Check if the user has a Cloudinary/external URL saved
    profile = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if profile and profile.avatar_url and profile.avatar_url.startswith("http"):
        return RedirectResponse(profile.avatar_url)
        
    UPLOAD_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
    )
    file_path = os.path.join(UPLOAD_DIR, "avatars", f"{user_id}.{ext}")
    
    if not os.path.exists(file_path):
        found = False
        for e in ["jpg", "jpeg", "png", "webp"]:
            alt_path = os.path.join(UPLOAD_DIR, "avatars", f"{user_id}.{e}")
            if os.path.exists(alt_path):
                file_path = alt_path
                ext = e
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Không tìm thấy ảnh đại diện.")

    media_type = f"image/{'jpeg' if ext in ['jpg', 'jpeg'] else 'png' if ext == 'png' else 'webp'}"
    return FileResponse(file_path, media_type=media_type)

@router.get("/doctors", response_model=List[schemas.ProfileResponse])
def get_doctors(db: Session = Depends(get_db)):
    # Chỉ trả về bác sĩ đã được xác minh (is_verified=True)
    doctors = db.query(models.Profile).filter(
        models.Profile.role == "doctor",
        models.Profile.is_verified == True
    ).all()
    return doctors

HOSPITAL_DEPARTMENTS = {
    # Miền Bắc (Hà Nội)
    "Bệnh viện Bạch Mai (Hà Nội)": [
        "Khoa Tim mạch", "Khoa Thần kinh", "Khoa Tiêu hóa", "Khoa Hồi sức tích cực", 
        "Khoa Hô hấp", "Khoa Thận tiết niệu", "Khoa Cơ xương khớp", "Khoa Nội tiết", 
        "Khoa Dị ứng lâm sàng", "Khoa Truyền nhiễm"
    ],
    "Bệnh viện Hữu nghị Việt Đức (Hà Nội)": [
        "Khoa Ngoại chấn thương", "Khoa Phẫu thuật tim mạch", "Khoa Phẫu thuật thần kinh", 
        "Khoa Phẫu thuật tiêu hóa", "Khoa Phẫu thuật cột sống", "Khoa Gây mê hồi sức", 
        "Khoa Phẫu thuật tiết niệu"
    ],
    "Bệnh viện Trung ương Quân đội 108 (Hà Nội)": [
        "Khoa Tim mạch", "Khoa Thần kinh", "Khoa Tiêu hóa", "Khoa Hồi sức cấp cứu", 
        "Khoa Chấn thương chỉnh hình", "Khoa Tiết niệu", "Khoa Ung thư", "Khoa Hô hấp"
    ],
    "Bệnh viện Đại học Y Hà Nội": [
        "Khoa Đa khoa", "Khoa Tim mạch", "Khoa Tiêu hóa", "Khoa Tai Mũi Họng", 
        "Khoa Mắt", "Khoa Da liễu", "Khoa Nội tiết", "Khoa Cơ xương khớp"
    ],
    "Bệnh viện Nhi Trung ương (Hà Nội)": [
        "Khoa Nhi chung", "Khoa Hồi sức tích cực nhi", "Khoa Tim mạch nhi", 
        "Khoa Tiêu hóa nhi", "Khoa Sơ sinh", "Khoa Hô hấp nhi", "Khoa Truyền nhiễm nhi"
    ],
    "Bệnh viện Phụ sản Trung ương (Hà Nội)": [
        "Khoa Sản thường", "Khoa Sản bệnh lý", "Khoa Phụ khoa", "Khoa Hỗ trợ sinh sản", 
        "Khoa Sơ sinh", "Khoa Kế hoạch hóa gia đình"
    ],
    "Bệnh viện K (Hà Nội)": [
        "Khoa Phẫu thuật ung bướu", "Khoa Hóa trị", "Khoa Xạ trị", 
        "Khoa Chăm sóc giảm nhẹ", "Khoa Tế bào học"
    ],
    "Bệnh viện E (Hà Nội)": [
        "Khoa Tim mạch", "Khoa Tiêu hóa", "Khoa Cơ xương khớp", "Khoa Nội tiết", 
        "Khoa Phẫu thuật chấn thương", "Khoa Thần kinh"
    ],
    "Bệnh viện Tim Hà Nội": [
        "Khoa Tim mạch can thiệp", "Khoa Phẫu thuật tim mạch", "Khoa Nội tim mạch", 
        "Khoa Nhịp học", "Khoa Hồi sức tim mạch"
    ],
    "Bệnh viện Mắt Trung ương (Hà Nội)": [
        "Khoa Kết giác mạc", "Khoa Thủy tinh thể", "Khoa Glaucoma", 
        "Khoa Chấn thương mắt", "Khoa Khúc xạ"
    ],

    # Miền Trung (Huế, Đà Nẵng)
    "Bệnh viện Trung ương Huế": [
        "Khoa Tim mạch", "Khoa Thần kinh", "Khoa Tiêu hóa", "Khoa Hồi sức tích cực", 
        "Khoa Cơ xương khớp", "Khoa Nội tiết", "Khoa Tai Mũi Họng", "Khoa Mắt"
    ],
    "Bệnh viện Đà Nẵng": [
        "Khoa Tim mạch", "Khoa Thần kinh", "Khoa Tiêu hóa", "Khoa Hồi sức cấp cứu", 
        "Khoa Nội tiết", "Khoa Chấn thương chỉnh hình", "Khoa Thận nhân tạo"
    ],
    "Bệnh viện Phụ sản - Nhi Đà Nẵng": [
        "Khoa Sản thường", "Khoa Sản bệnh lý", "Khoa Phụ khoa", "Khoa Hỗ trợ sinh sản", 
        "Khoa Nhi chung", "Khoa Hồi sức tích cực nhi", "Khoa Sơ sinh"
    ],
    "Bệnh viện Trường Đại học Y - Dược Huế": [
        "Khoa Đa khoa", "Khoa Tim mạch", "Khoa Nội tiết", "Khoa Nhi khoa", 
        "Khoa Sản phụ khoa", "Khoa Tai Mũi Họng", "Khoa Da liễu"
    ],

    # Miền Nam (TP. HCM, Cần Thơ)
    "Bệnh viện Chợ Rẫy (TP. HCM)": [
        "Khoa Tim mạch", "Khoa Chấn thương chỉnh hình", "Khoa Thần kinh", "Khoa Tiêu hóa", 
        "Khoa Hồi sức cấp cứu", "Khoa Thận nhân tạo", "Khoa Ung bướu", "Khoa Hô hấp"
    ],
    "Bệnh viện Nhân dân 115 (TP. HCM)": [
        "Khoa Tim mạch", "Khoa Thần kinh", "Khoa Tiêu hóa", "Khoa Hồi sức tích cực", 
        "Khoa Cơ xương khớp", "Khoa Thận tiết niệu", "Khoa Nội tiết"
    ],
    "Bệnh viện Đại học Y Dược TP. HCM": [
        "Khoa Đa khoa", "Khoa Tim mạch", "Khoa Tiêu hóa", "Khoa Nội tiết", 
        "Khoa Tai Mũi Họng", "Khoa Mắt", "Khoa Da liễu", "Khoa Cơ xương khớp"
    ],
    "Bệnh viện Từ Dũ (TP. HCM)": [
        "Khoa Sản thường", "Khoa Sản bệnh lý", "Khoa Phụ khoa", "Khoa Hỗ trợ sinh sản", 
        "Khoa Sơ sinh", "Khoa Kế hoạch hóa gia đình"
    ],
    "Bệnh viện Hùng Vương (TP. HCM)": [
        "Khoa Sản thường", "Khoa Sản bệnh lý", "Khoa Phụ khoa", "Khoa Hỗ trợ sinh sản", 
        "Khoa Sơ sinh"
    ],
    "Bệnh viện Nhi đồng 1 (TP. HCM)": [
        "Khoa Nhi chung", "Khoa Hồi sức tích cực nhi", "Khoa Tim mạch nhi", 
        "Khoa Tiêu hóa nhi", "Khoa Sơ sinh", "Khoa Hô hấp nhi"
    ],
    "Bệnh viện Nhi đồng 2 (TP. HCM)": [
        "Khoa Nhi chung", "Khoa Hồi sức tích cực nhi", "Khoa Ngoại nhi", 
        "Khoa Ung bướu nhi", "Khoa Sơ sinh"
    ],
    "Bệnh viện Chấn thương Chỉnh hình TP. HCM": [
        "Khoa Chấn thương chỉnh hình", "Khoa Cột sống", "Khoa Chi trên", 
        "Khoa Chi dưới", "Khoa Vi phẫu tạo hình"
    ],
    "Bệnh viện Ung bướu TP. HCM": [
        "Khoa Phẫu thuật ung bướu", "Khoa Hóa trị", "Khoa Xạ trị", 
        "Khoa Chăm sóc giảm nhẹ"
    ],
    "Bệnh viện Đa khoa Trung ương Cần Thơ": [
        "Khoa Tim mạch", "Khoa Thần kinh", "Khoa Tiêu hóa", "Khoa Hồi sức cấp cứu", 
        "Khoa Thận tiết niệu", "Khoa Cơ xương khớp"
    ],
    "Bệnh viện Phụ sản TP. Cần Thơ": [
        "Khoa Sản thường", "Khoa Sản bệnh lý", "Khoa Phụ khoa", "Khoa Hỗ trợ sinh sản", 
        "Khoa Sơ sinh"
    ],

    # Bệnh viện tư nhân quốc tế lớn
    "Bệnh viện Đa khoa Quốc tế Vinmec Times City (Hà Nội)": [
        "Khoa Đa khoa", "Khoa Tim mạch", "Khoa Sản phụ khoa", "Khoa Nhi khoa", 
        "Khoa Tai Mũi Họng", "Khoa Răng Hàm Mặt", "Khoa Da liễu", "Khoa Ung bướu"
    ],
    "Bệnh viện Đa khoa Quốc tế Vinmec Central Park (TP. HCM)": [
        "Khoa Đa khoa", "Khoa Tim mạch", "Khoa Sản phụ khoa", "Khoa Nhi khoa", 
        "Khoa Tai Mũi Họng", "Khoa Răng Hàm Mặt", "Khoa Ung bướu"
    ],
    "Bệnh viện Đa khoa Tâm Anh (Hà Nội)": [
        "Khoa Hỗ trợ sinh sản", "Khoa Sản phụ khoa", "Khoa Tim mạch", 
        "Khoa Chấn thương chỉnh hình", "Khoa Nhi khoa", "Khoa Tai Mũi Họng"
    ],
    "Bệnh viện Đa khoa Tâm Anh (TP. HCM)": [
        "Khoa Hỗ trợ sinh sản", "Khoa Sản phụ khoa", "Khoa Tim mạch", 
        "Khoa Chấn thương chỉnh hình", "Khoa Nhi khoa", "Khoa Tai Mũi Họng"
    ],
    "Bệnh viện FV (TP. HCM)": [
        "Khoa Đa khoa", "Khoa Tim mạch", "Khoa Sản phụ khoa", "Khoa Nhi khoa", 
        "Khoa Tai Mũi Họng", "Khoa Mắt", "Khoa Ung bướu"
    ]
}

@router.get("/hospitals", response_model=List[str])
def get_hospitals():
    return list(HOSPITAL_DEPARTMENTS.keys())

@router.get("/hospitals/specialties", response_model=List[str])
def get_hospital_specialties(hospital: str):
    return HOSPITAL_DEPARTMENTS.get(hospital, [])

@router.post("/phone/login")
def phone_login(payload: dict, db: Session = Depends(get_db)):
    phone = payload.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp số điện thoại.")
    
    # Check if a profile with this phone number exists
    profile = db.query(models.Profile).filter(models.Profile.phone == phone).first()
    if not profile:
        raise HTTPException(
            status_code=404, 
            detail="Số điện thoại chưa được đăng ký trong hệ thống."
        )
    
    # In a real environment, we'd trigger an SMS service.
    # Here we mock it and tell the user to use 123456.
    return {"message": "Mã OTP đã được gửi.", "otp_hint": "123456"}

@router.post("/phone/verify")
@limiter.limit("5/minute")
def phone_verify(request: Request, payload: dict, response: Response, db: Session = Depends(get_db)):
    phone = payload.get("phone")
    token = payload.get("token")
    
    if not phone or not token:
        raise HTTPException(status_code=400, detail="Thiếu thông tin số điện thoại hoặc mã OTP.")
        
    # Standard dummy/demo code verification
    if token != "123456":
        raise HTTPException(status_code=401, detail="Mã OTP không chính xác.")
        
    profile = db.query(models.Profile).filter(models.Profile.phone == phone).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản với số điện thoại này.")
        
    user = db.query(models.User).filter(models.User.id == profile.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    # Generate token
    token_data = {"sub": str(user.id), "role": profile.role}
    access_token = auth.create_access_token(data=token_data)

    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=1440 * 60,
        samesite="lax",
        secure=False
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email
        },
        "profile": profile
    }

@router.put("/password")
def update_password(
    payload: schemas.PasswordUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    current_user.hashed_password = auth.get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Mật khẩu đã được cập nhật thành công."}


# Passkey flow APIs
@router.post("/passkey/register")
def passkey_register(
    payload: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    action = payload.get("action")
    if action == "generate-options":
        # Generate standard credential options for @simplewebauthn/browser
        challenge = uuid.uuid4().hex
        
        # In a real environment, we'd cache this challenge in session or cache to check on verify step.
        # Here we return it to the frontend.
        options = {
            "challenge": challenge,
            "rp": {
                "name": "HealthChainAI",
                "id": "localhost"
            },
            "user": {
                "id": str(current_user.id),
                "name": current_user.email,
                "displayName": current_user.email
            },
            "pubKeyCredParams": [
                {"alg": -7, "type": "public-key"}, # ES256
                {"alg": -257, "type": "public-key"} # RS256
            ],
            "authenticatorSelection": {
                "authenticatorAttachment": "platform",
                "residentKey": "preferred",
                "userVerification": "preferred"
            },
            "timeout": 60000,
            "attestation": "none"
        }
        return options
        
    elif action == "verify":
        credential = payload.get("credential")
        if not credential:
            raise HTTPException(status_code=400, detail="Missing credential data")
            
        cred_id = credential.get("id")
        
        # Save credential info
        new_cred = models.PasskeyCredential(
            user_id=current_user.id,
            credential_id=cred_id,
            public_key="dummy_public_key", # For simulation/demo purposes
            counter=0,
            device_type=credential.get("authenticatorAttachment", "platform"),
            backed_up=False,
            transports=[]
        )
        db.add(new_cred)
        
        # Update user profile to enable passkey
        profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
        if profile:
            profile.passkey_enabled = True
            
        db.commit()
        return {"verified": True}
        
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@router.post("/passkey/login")
def passkey_login(
    payload: dict,
    response: Response,
    db: Session = Depends(get_db)
):
    action = payload.get("action")
    email = payload.get("email")
    
    if action == "generate-options":
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
            
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản với email này.")
            
        # Get credentials
        credentials = db.query(models.PasskeyCredential).filter(models.PasskeyCredential.user_id == user.id).all()
        allow_credentials = []
        for cred in credentials:
            allow_credentials.append({
                "id": cred.credential_id,
                "type": "public-key"
            })
            
        challenge = uuid.uuid4().hex
        
        options = {
            "challenge": challenge,
            "rpId": "localhost",
            "allowCredentials": allow_credentials,
            "userVerification": "preferred",
            "timeout": 60000,
            "userId": str(user.id)
        }
        return options
        
    elif action == "verify":
        credential = payload.get("credential")
        user_id_str = payload.get("userId")
        
        if not credential or not user_id_str:
            raise HTTPException(status_code=400, detail="Invalid request parameters")
            
        user_id = uuid.UUID(user_id_str)
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        cred_id = credential.get("id")
        
        # Verify if credential exists for this user
        db_cred = db.query(models.PasskeyCredential).filter(
            models.PasskeyCredential.user_id == user.id,
            models.PasskeyCredential.credential_id == cred_id
        ).first()
        
        if not db_cred:
            raise HTTPException(status_code=401, detail="Passkey không hợp lệ.")
            
        # Update counter if provided
        db_cred.counter += 1
        db.commit()
        
        profile = db.query(models.Profile).filter(models.Profile.id == user.id).first()
        role = profile.role if profile else "patient"

        # Generate token
        token_data = {"sub": str(user.id), "role": role}
        access_token = auth.create_access_token(data=token_data)

        # Set access token cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=1440 * 60,
            samesite="lax",
            secure=False
        )
        
        return {
            "verified": True,
            "redirectUrl": "/dashboard",
            "access_token": access_token
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

# Get passkeys list directly
@router.get("/passkey/list", response_model=List[dict])
def list_passkeys(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    credentials = db.query(models.PasskeyCredential).filter(models.PasskeyCredential.user_id == current_user.id).all()
    return [
        {
            "id": str(c.id),
            "credential_id": c.credential_id,
            "device_type": c.device_type,
            "created_at": c.created_at
        } for c in credentials
    ]

@router.delete("/passkey/{cred_id}")
def delete_passkey(
    cred_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve credential (db UUID id or string credential_id)
    cred = db.query(models.PasskeyCredential).filter(
        models.PasskeyCredential.user_id == current_user.id,
        (models.PasskeyCredential.id == cred_id) | (models.PasskeyCredential.credential_id == cred_id)
    ).first()
    
    if not cred:
        raise HTTPException(status_code=404, detail="Passkey not found")
        
    db.delete(cred)
    
    # Check if this was the last passkey, and update profile
    remaining = db.query(models.PasskeyCredential).filter(models.PasskeyCredential.user_id == current_user.id).count()
    if remaining == 0:
        profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
        if profile:
            profile.passkey_enabled = False
            
    db.commit()
    return {"message": "Passkey deleted successfully"}
