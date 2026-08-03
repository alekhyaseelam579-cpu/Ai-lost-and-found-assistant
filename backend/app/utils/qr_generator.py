import qrcode
import io
import base64
import uuid

def generate_item_qr_code(item_id: str, item_name: str) -> str:
    """Generates a base64 encoded PNG QR code image containing item verification payload."""
    payload = f"AILOSTFOUND:VERIFY:item_id={item_id}:name={item_name}:verify_token={uuid.uuid4().hex[:8]}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#1E293B", back_color="#FFFFFF")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"
