import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter()

@router.post("/signup", response_model=schemas.Token)
def signup(user_data: schemas.UserRegister, response: Response, db: Session = Depends(get_db)):
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
        is_verified=(user_data.role == "doctor"),  # Bác sĩ auto-verified cho MVP
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
        max_age=1440 * 60,  # 1 day in seconds
        samesite="lax",
        secure=False  # Set to True in production
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login")
def login(login_data: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
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
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
        },
        "profile": profile
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
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

@router.get("/doctors", response_model=List[schemas.ProfileResponse])
def get_doctors(db: Session = Depends(get_db)):
    # Chỉ trả về bác sĩ đã được xác minh (is_verified=True)
    doctors = db.query(models.Profile).filter(
        models.Profile.role == "doctor",
        models.Profile.is_verified == True
    ).all()
    return doctors

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
def phone_verify(payload: dict, response: Response, db: Session = Depends(get_db)):
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
